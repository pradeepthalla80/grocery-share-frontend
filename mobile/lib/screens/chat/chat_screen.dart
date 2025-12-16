import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';

class ChatScreen extends StatefulWidget {
  final String? conversationId;
  final String? recipientId;
  final String? recipientName;
  final String? itemId;

  const ChatScreen({
    super.key,
    this.conversationId,
    this.recipientId,
    this.recipientName,
    this.itemId,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  String? _currentConversationId;

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  Future<void> _initializeChat() async {
    final chatProvider = context.read<ChatProvider>();

    if (widget.conversationId != null) {
      _currentConversationId = widget.conversationId;
      await chatProvider.fetchMessages(widget.conversationId!);
      chatProvider.markAsRead(widget.conversationId!);
      chatProvider.startMessagePolling(widget.conversationId!);
    } else if (widget.recipientId != null) {
      final conversation = await chatProvider.getOrCreateConversation(
        recipientId: widget.recipientId!,
        itemId: widget.itemId,
      );
      if (conversation != null) {
        _currentConversationId = conversation.id;
        await chatProvider.fetchMessages(conversation.id);
        chatProvider.startMessagePolling(conversation.id);
      }
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    context.read<ChatProvider>().stopMessagePolling();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty || _currentConversationId == null) return;

    _messageController.clear();

    final chatProvider = context.read<ChatProvider>();
    final success = await chatProvider.sendMessage(
      conversationId: _currentConversationId!,
      content: message,
    );

    if (success) {
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.recipientName ?? 'Chat'),
      ),
      body: Consumer2<ChatProvider, AuthProvider>(
        builder: (context, chatProvider, authProvider, _) {
          if (chatProvider.isLoading && chatProvider.messages.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return Column(
            children: [
              Expanded(
                child: chatProvider.messages.isEmpty
                    ? const Center(
                        child: Text(
                          'No messages yet. Start the conversation!',
                          style: TextStyle(color: AppColors.textMuted),
                        ),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: chatProvider.messages.length,
                        itemBuilder: (context, index) {
                          final message = chatProvider.messages[index];
                          final isMine = message.isMine(authProvider.user?.id ?? '');

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              mainAxisAlignment: isMine
                                  ? MainAxisAlignment.end
                                  : MainAxisAlignment.start,
                              children: [
                                if (!isMine) ...[
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundImage: message.sender?.profileImage != null
                                        ? CachedNetworkImageProvider(
                                            message.sender!.profileImage!)
                                        : null,
                                    child: message.sender?.profileImage == null
                                        ? Text(
                                            message.sender?.name.isNotEmpty == true
                                                ? message.sender!.name[0].toUpperCase()
                                                : '?',
                                            style: const TextStyle(fontSize: 12),
                                          )
                                        : null,
                                  ),
                                  const SizedBox(width: 8),
                                ],
                                Flexible(
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 10,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isMine
                                          ? AppColors.primary
                                          : AppColors.divider,
                                      borderRadius: BorderRadius.circular(18),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text(
                                          message.content,
                                          style: TextStyle(
                                            color: isMine
                                                ? Colors.white
                                                : AppColors.textPrimary,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          DateFormat('h:mm a').format(message.createdAt),
                                          style: TextStyle(
                                            fontSize: 10,
                                            color: isMine
                                                ? Colors.white70
                                                : AppColors.textMuted,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),

              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -2),
                    ),
                  ],
                ),
                child: SafeArea(
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _messageController,
                          textCapitalization: TextCapitalization.sentences,
                          decoration: InputDecoration(
                            hintText: 'Type a message...',
                            filled: true,
                            fillColor: AppColors.divider,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(24),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 10,
                            ),
                          ),
                          onSubmitted: (_) => _sendMessage(),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          icon: chatProvider.isSending
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation(Colors.white),
                                  ),
                                )
                              : const Icon(Icons.send, color: Colors.white),
                          onPressed: chatProvider.isSending ? null : _sendMessage,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
