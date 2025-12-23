import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

import '../config/app_config.dart';
import '../models/message.dart';
import '../services/chat_service.dart';
import 'auth_provider.dart';

class ChatProvider with ChangeNotifier {
  final ChatService _chatService = ChatService();
  
  AuthProvider? _authProvider;
  
  List<Conversation> _conversations = [];
  List<Message> _messages = [];
  Conversation? _currentConversation;
  
  bool _isLoading = false;
  bool _isSending = false;
  String? _error;
  int _unreadCount = 0;
  
  Timer? _pollingTimer;
  Timer? _messagePollingTimer;
  
  List<Conversation> get conversations => _conversations;
  List<Message> get messages => _messages;
  Conversation? get currentConversation => _currentConversation;
  
  bool get isLoading => _isLoading;
  bool get isSending => _isSending;
  String? get error => _error;
  int get unreadCount => _unreadCount;
  
  void updateAuth(AuthProvider auth) {
    _authProvider = auth;
    if (auth.isAuthenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        startPolling();
      });
    } else {
      stopPolling();
      _conversations = [];
      _messages = [];
      _currentConversation = null;
      _unreadCount = 0;
    }
  }
  
  void startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(
      Duration(seconds: AppConfig.notificationPollingInterval),
      (_) => fetchUnreadCount(),
    );
    fetchUnreadCount();
  }
  
  void stopPolling() {
    _pollingTimer?.cancel();
    _messagePollingTimer?.cancel();
    _pollingTimer = null;
    _messagePollingTimer = null;
  }
  
  void startMessagePolling(String conversationId) {
    _messagePollingTimer?.cancel();
    _messagePollingTimer = Timer.periodic(
      Duration(seconds: AppConfig.chatPollingInterval),
      (_) => fetchMessages(conversationId, silent: true),
    );
  }
  
  void stopMessagePolling() {
    _messagePollingTimer?.cancel();
    _messagePollingTimer = null;
  }
  
  Future<void> fetchConversations() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    final result = await _chatService.getConversations();
    
    _isLoading = false;
    
    if (result.success && result.conversations != null) {
      _conversations = result.conversations!;
    } else {
      _error = result.error;
    }
    
    notifyListeners();
  }
  
  Future<Conversation?> getOrCreateConversation({
    required String recipientId,
    String? itemId,
  }) async {
    _isLoading = true;
    notifyListeners();
    
    final result = await _chatService.getOrCreateConversation(
      recipientId: recipientId,
      itemId: itemId,
    );
    
    _isLoading = false;
    
    if (result.success && result.conversation != null) {
      _currentConversation = result.conversation;
      
      final existingIndex = _conversations.indexWhere((c) => c.id == result.conversation!.id);
      if (existingIndex == -1) {
        _conversations.insert(0, result.conversation!);
      }
      
      notifyListeners();
      return result.conversation;
    }
    
    _error = result.error;
    notifyListeners();
    return null;
  }
  
  Future<void> fetchMessages(String conversationId, {bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      notifyListeners();
    }
    
    final result = await _chatService.getMessages(conversationId);
    
    if (!silent) {
      _isLoading = false;
    }
    
    if (result.success && result.messages != null) {
      _messages = result.messages!.reversed.toList();
      notifyListeners();
    }
  }
  
  Future<bool> sendMessage({
    required String conversationId,
    required String content,
  }) async {
    _isSending = true;
    notifyListeners();
    
    final result = await _chatService.sendMessage(
      conversationId: conversationId,
      content: content,
    );
    
    _isSending = false;
    
    if (result.success && result.message != null) {
      _messages.add(result.message!);
      
      final convIndex = _conversations.indexWhere((c) => c.id == conversationId);
      if (convIndex != -1) {
        final conv = _conversations.removeAt(convIndex);
        _conversations.insert(0, Conversation(
          id: conv.id,
          participants: conv.participants,
          item: conv.item,
          itemId: conv.itemId,
          lastMessage: result.message,
          unreadCount: 0,
          createdAt: conv.createdAt,
          updatedAt: DateTime.now(),
        ));
      }
      
      notifyListeners();
      return true;
    }
    
    return false;
  }
  
  Future<void> markAsRead(String conversationId) async {
    final success = await _chatService.markAsRead(conversationId);
    
    if (success) {
      final index = _conversations.indexWhere((c) => c.id == conversationId);
      if (index != -1) {
        final conv = _conversations[index];
        _conversations[index] = Conversation(
          id: conv.id,
          participants: conv.participants,
          item: conv.item,
          itemId: conv.itemId,
          lastMessage: conv.lastMessage,
          unreadCount: 0,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        );
        notifyListeners();
      }
      await fetchUnreadCount();
    }
  }
  
  Future<void> fetchUnreadCount() async {
    final count = await _chatService.getUnreadCount();
    if (_unreadCount != count) {
      _unreadCount = count;
      notifyListeners();
    }
  }
  
  void setCurrentConversation(Conversation? conversation) {
    _currentConversation = conversation;
    _messages = [];
    notifyListeners();
  }
  
  void clearMessages() {
    _messages = [];
    _currentConversation = null;
    stopMessagePolling();
    notifyListeners();
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
  
  @override
  void dispose() {
    stopPolling();
    super.dispose();
  }
}
