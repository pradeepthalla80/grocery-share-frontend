import 'user.dart';
import 'item.dart';

class Conversation {
  final String id;
  final List<User> participants;
  final Item? item;
  final String? itemId;
  final Message? lastMessage;
  final int unreadCount;
  final DateTime createdAt;
  final DateTime updatedAt;

  Conversation({
    required this.id,
    required this.participants,
    this.item,
    this.itemId,
    this.lastMessage,
    this.unreadCount = 0,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['_id'] ?? json['id'] ?? '',
      participants: (json['participants'] as List<dynamic>?)
              ?.map((p) => User.fromJson(p))
              .toList() ??
          [],
      item: json['item'] != null ? Item.fromJson(json['item']) : null,
      itemId: json['item']?['_id'] ?? json['itemId'],
      lastMessage: json['lastMessage'] != null
          ? Message.fromJson(json['lastMessage'])
          : null,
      unreadCount: json['unreadCount'] ?? 0,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'participants': participants.map((p) => p.toJson()).toList(),
      'itemId': itemId,
      'lastMessage': lastMessage?.toJson(),
      'unreadCount': unreadCount,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  User? getOtherParticipant(String currentUserId) {
    try {
      return participants.firstWhere((p) => p.id != currentUserId);
    } catch (_) {
      return participants.isNotEmpty ? participants.first : null;
    }
  }

  bool get hasUnread => unreadCount > 0;
}

class Message {
  final String id;
  final String conversationId;
  final User? sender;
  final String senderId;
  final String content;
  final String type;
  final bool isRead;
  final DateTime createdAt;

  Message({
    required this.id,
    required this.conversationId,
    this.sender,
    required this.senderId,
    required this.content,
    this.type = 'text',
    this.isRead = false,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['_id'] ?? json['id'] ?? '',
      conversationId: json['conversationId'] ?? json['conversation'] ?? '',
      sender: json['sender'] != null ? User.fromJson(json['sender']) : null,
      senderId: json['sender']?['_id'] ?? json['senderId'] ?? '',
      content: json['content'] ?? '',
      type: json['type'] ?? 'text',
      isRead: json['isRead'] ?? false,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'content': content,
      'type': type,
      'isRead': isRead,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  bool isMine(String currentUserId) => senderId == currentUserId;
}
