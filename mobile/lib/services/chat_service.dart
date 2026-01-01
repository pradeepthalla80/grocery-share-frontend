import 'dart:developer' as developer;
import 'package:dio/dio.dart';

import '../models/message.dart';
import 'api_client.dart';

class ChatService {
  final ApiClient _api = ApiClient();
  
  Future<ConversationsResult> getConversations() async {
    try {
      developer.log('[ChatService] Fetching conversations...');
      final response = await _api.get('/chat/conversations');
      developer.log('[ChatService] Response type: ${response.data.runtimeType}');
      developer.log('[ChatService] Response: ${response.data}');
      
      List<dynamic>? conversationsData;
      
      if (response.data is Map) {
        conversationsData = response.data['conversations'] as List<dynamic>? 
            ?? response.data['data'] as List<dynamic>?;
      } else if (response.data is List) {
        conversationsData = response.data;
      }
      
      if (conversationsData == null) {
        developer.log('[ChatService] ERROR: No conversations data found in response');
        return ConversationsResult(
          success: false, 
          error: 'Unexpected response format from server',
        );
      }
      
      final conversations = conversationsData
          .map((c) {
            try {
              return Conversation.fromJson(c);
            } catch (e) {
              developer.log('[ChatService] Error parsing conversation: $e');
              return null;
            }
          })
          .whereType<Conversation>()
          .toList();
      
      developer.log('[ChatService] Parsed ${conversations.length} conversations');
      return ConversationsResult(success: true, conversations: conversations);
    } catch (e) {
      developer.log('[ChatService] ERROR fetching conversations: $e');
      if (e is DioException) {
        developer.log('[ChatService] Response status: ${e.response?.statusCode}');
        developer.log('[ChatService] Response data: ${e.response?.data}');
      }
      return ConversationsResult(success: false, error: _parseError(e));
    }
  }
  
  Future<ConversationResult> getOrCreateConversation({
    required String recipientId,
    String? itemId,
  }) async {
    try {
      final response = await _api.post('/chat/conversations', data: {
        'recipientId': recipientId,
        if (itemId != null) 'itemId': itemId,
      });
      
      final conversation = Conversation.fromJson(response.data['conversation'] ?? response.data);
      return ConversationResult(success: true, conversation: conversation);
    } catch (e) {
      return ConversationResult(success: false, error: _parseError(e));
    }
  }
  
  Future<MessagesResult> getMessages(String conversationId, {int page = 1, int limit = 50}) async {
    try {
      final response = await _api.get(
        '/chat/conversations/$conversationId/messages',
        queryParameters: {'page': page, 'limit': limit},
      );
      
      final messages = (response.data['messages'] as List<dynamic>)
          .map((m) => Message.fromJson(m))
          .toList();
      
      return MessagesResult(
        success: true,
        messages: messages,
        hasMore: response.data['hasMore'] ?? false,
      );
    } catch (e) {
      return MessagesResult(success: false, error: _parseError(e));
    }
  }
  
  Future<MessageResult> sendMessage({
    required String conversationId,
    required String content,
    String type = 'text',
  }) async {
    try {
      final response = await _api.post(
        '/chat/conversations/$conversationId/messages',
        data: {
          'content': content,
          'type': type,
        },
      );
      
      final message = Message.fromJson(response.data['message'] ?? response.data);
      return MessageResult(success: true, message: message);
    } catch (e) {
      return MessageResult(success: false, error: _parseError(e));
    }
  }
  
  Future<bool> markAsRead(String conversationId) async {
    try {
      await _api.post('/chat/conversations/$conversationId/read');
      return true;
    } catch (_) {
      return false;
    }
  }
  
  Future<int> getUnreadCount() async {
    try {
      final response = await _api.get('/chat/unread-count');
      return response.data['count'] ?? 0;
    } catch (_) {
      return 0;
    }
  }
  
  String _parseError(dynamic e) {
    if (e is DioException && e.response?.data != null) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        return data['message'];
      }
    }
    return 'An error occurred. Please try again.';
  }
}

class ConversationsResult {
  final bool success;
  final List<Conversation>? conversations;
  final String? error;
  
  ConversationsResult({
    required this.success,
    this.conversations,
    this.error,
  });
}

class ConversationResult {
  final bool success;
  final Conversation? conversation;
  final String? error;
  
  ConversationResult({
    required this.success,
    this.conversation,
    this.error,
  });
}

class MessagesResult {
  final bool success;
  final List<Message>? messages;
  final bool hasMore;
  final String? error;
  
  MessagesResult({
    required this.success,
    this.messages,
    this.hasMore = false,
    this.error,
  });
}

class MessageResult {
  final bool success;
  final Message? message;
  final String? error;
  
  MessageResult({
    required this.success,
    this.message,
    this.error,
  });
}
