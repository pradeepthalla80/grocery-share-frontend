import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../config/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/chat_provider.dart';
import '../../widgets/common/empty_state.dart';

class ConversationsScreen extends StatefulWidget {
  const ConversationsScreen({super.key});

  @override
  State<ConversationsScreen> createState() => _ConversationsScreenState();
}

class _ConversationsScreenState extends State<ConversationsScreen> {
  @override
  void initState() {
    super.initState();
    context.read<ChatProvider>().fetchConversations();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
      ),
      body: Consumer2<ChatProvider, AuthProvider>(
        builder: (context, chatProvider, authProvider, _) {
          if (chatProvider.isLoading && chatProvider.conversations.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (chatProvider.conversations.isEmpty) {
            return const EmptyState(
              icon: Icons.chat_bubble_outline,
              title: 'No Messages Yet',
              message: 'Start a conversation by contacting a seller or responding to a request.',
            );
          }

          return RefreshIndicator(
            onRefresh: () => chatProvider.fetchConversations(),
            child: ListView.builder(
              itemCount: chatProvider.conversations.length,
              itemBuilder: (context, index) {
                final conversation = chatProvider.conversations[index];
                final otherUser = conversation.getOtherParticipant(
                  authProvider.user?.id ?? '',
                );

                return ListTile(
                  leading: Stack(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundImage: otherUser?.profileImage != null
                            ? CachedNetworkImageProvider(otherUser!.profileImage!)
                            : null,
                        child: otherUser?.profileImage == null
                            ? Text(
                                otherUser?.name.isNotEmpty == true
                                    ? otherUser!.name[0].toUpperCase()
                                    : '?',
                              )
                            : null,
                      ),
                      if (conversation.hasUnread)
                        Positioned(
                          right: 0,
                          top: 0,
                          child: Container(
                            width: 12,
                            height: 12,
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                            ),
                          ),
                        ),
                    ],
                  ),
                  title: Row(
                    children: [
                      Expanded(
                        child: Text(
                          otherUser?.name ?? 'User',
                          style: TextStyle(
                            fontWeight: conversation.hasUnread
                                ? FontWeight.bold
                                : FontWeight.normal,
                          ),
                        ),
                      ),
                      if (conversation.lastMessage != null)
                        Text(
                          _formatTime(conversation.lastMessage!.createdAt),
                          style: TextStyle(
                            fontSize: 12,
                            color: conversation.hasUnread
                                ? AppColors.primary
                                : AppColors.textMuted,
                          ),
                        ),
                    ],
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (conversation.item != null)
                        Text(
                          conversation.item!.title,
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.primary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      if (conversation.lastMessage != null)
                        Text(
                          conversation.lastMessage!.content,
                          style: TextStyle(
                            color: conversation.hasUnread
                                ? AppColors.textPrimary
                                : AppColors.textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                    ],
                  ),
                  trailing: conversation.hasUnread
                      ? Container(
                          width: 20,
                          height: 20,
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              '${conversation.unreadCount}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        )
                      : null,
                  onTap: () {
                    Navigator.pushNamed(
                      context,
                      AppRoutes.chat,
                      arguments: {
                        'conversationId': conversation.id,
                        'recipientId': otherUser?.id,
                        'recipientName': otherUser?.name ?? 'User',
                        'itemId': conversation.itemId,
                      },
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inDays > 7) {
      return DateFormat('MMM d').format(time);
    } else if (difference.inDays > 0) {
      return '${difference.inDays}d';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m';
    } else {
      return 'now';
    }
  }
}
