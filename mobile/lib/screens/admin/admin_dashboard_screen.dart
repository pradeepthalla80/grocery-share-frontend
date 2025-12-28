import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../services/admin_service.dart';
import '../../models/user.dart';
import '../../models/item.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final AdminService _adminService = AdminService();
  AdminStatsResult? _stats;
  bool _isLoading = true;
  
  List<User> _users = [];
  List<Item> _items = [];
  bool _isLoadingUsers = false;
  bool _isLoadingItems = false;
  int _usersPage = 1;
  int _itemsPage = 1;
  bool _hasMoreUsers = true;
  bool _hasMoreItems = true;
  final _userSearchController = TextEditingController();
  final _itemSearchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadStats();
  }

  void _onTabChanged() {
    if (_tabController.index == 1 && _users.isEmpty && !_isLoadingUsers) {
      _loadUsers();
    } else if (_tabController.index == 2 && _items.isEmpty && !_isLoadingItems) {
      _loadItems();
    }
  }

  Future<void> _loadStats() async {
    setState(() => _isLoading = true);
    _stats = await _adminService.getDashboardStats();
    setState(() => _isLoading = false);
  }

  Future<void> _loadUsers({bool refresh = false}) async {
    if (_isLoadingUsers) return;
    
    if (refresh) {
      _usersPage = 1;
      _hasMoreUsers = true;
    }
    
    setState(() => _isLoadingUsers = true);
    
    final result = await _adminService.getUsers(
      page: _usersPage,
      search: _userSearchController.text.trim().isNotEmpty 
          ? _userSearchController.text.trim() 
          : null,
    );
    
    setState(() {
      _isLoadingUsers = false;
      if (result.success && result.users != null) {
        if (refresh) {
          _users = result.users!;
        } else {
          _users.addAll(result.users!);
        }
        _hasMoreUsers = _usersPage < (result.totalPages ?? 1);
        _usersPage++;
      }
    });
  }

  Future<void> _loadItems({bool refresh = false}) async {
    if (_isLoadingItems) return;
    
    if (refresh) {
      _itemsPage = 1;
      _hasMoreItems = true;
    }
    
    setState(() => _isLoadingItems = true);
    
    final result = await _adminService.getAllItems(
      page: _itemsPage,
      search: _itemSearchController.text.trim().isNotEmpty 
          ? _itemSearchController.text.trim() 
          : null,
    );
    
    setState(() {
      _isLoadingItems = false;
      if (result.success && result.items != null) {
        if (refresh) {
          _items = result.items!;
        } else {
          _items.addAll(result.items!);
        }
        _hasMoreItems = _itemsPage < (result.totalPages ?? 1);
        _itemsPage++;
      }
    });
  }

  Future<void> _updateUserRole(User user, String newRole) async {
    final success = await _adminService.updateUserRole(user.id, newRole);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${user.name} role updated to $newRole')),
      );
      _loadUsers(refresh: true);
    }
  }

  Future<void> _suspendUser(User user) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Suspend User'),
        content: Text('Are you sure you want to suspend ${user.name}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Suspend'),
          ),
        ],
      ),
    );
    
    if (confirm == true) {
      final success = await _adminService.suspendUser(user.id);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${user.name} has been suspended')),
        );
        _loadUsers(refresh: true);
      }
    }
  }

  Future<void> _deleteItem(Item item) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Item'),
        content: Text('Are you sure you want to delete "${item.title}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    
    if (confirm == true) {
      final success = await _adminService.deleteItem(item.id);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('"${item.title}" has been deleted')),
        );
        _loadItems(refresh: true);
      }
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _userSearchController.dispose();
    _itemSearchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Dashboard'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Users'),
            Tab(text: 'Items'),
          ],
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          indicatorColor: AppColors.primary,
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(),
                _buildUsersTab(),
                _buildItemsTab(),
              ],
            ),
    );
  }

  Widget _buildOverviewTab() {
    if (_stats == null) {
      return const Center(child: Text('Unable to load stats'));
    }

    return RefreshIndicator(
      onRefresh: _loadStats,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: [
                _buildStatCard(
                  'Total Users',
                  _stats!.totalUsers.toString(),
                  Icons.people,
                  AppColors.primary,
                ),
                _buildStatCard(
                  'Total Items',
                  _stats!.totalItems.toString(),
                  Icons.shopping_basket,
                  AppColors.success,
                ),
                _buildStatCard(
                  'Active Items',
                  _stats!.activeItems.toString(),
                  Icons.check_circle,
                  AppColors.info,
                ),
                _buildStatCard(
                  'Completed',
                  _stats!.completedExchanges.toString(),
                  Icons.handshake,
                  AppColors.accent,
                ),
                _buildStatCard(
                  'Store Owners',
                  _stats!.storeOwners.toString(),
                  Icons.store,
                  AppColors.store,
                ),
                _buildStatCard(
                  'Total Requests',
                  _stats!.totalRequests.toString(),
                  Icons.list_alt,
                  AppColors.warning,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUsersTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: _userSearchController,
            decoration: InputDecoration(
              hintText: 'Search users...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                icon: const Icon(Icons.search),
                onPressed: () => _loadUsers(refresh: true),
              ),
            ),
            onSubmitted: (_) => _loadUsers(refresh: true),
          ),
        ),
        Expanded(
          child: _isLoadingUsers && _users.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : _users.isEmpty
                  ? const Center(child: Text('No users found'))
                  : RefreshIndicator(
                      onRefresh: () => _loadUsers(refresh: true),
                      child: ListView.builder(
                        itemCount: _users.length + (_hasMoreUsers ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (index == _users.length) {
                            if (!_isLoadingUsers) {
                              _loadUsers();
                            }
                            return const Center(
                              child: Padding(
                                padding: EdgeInsets.all(16),
                                child: CircularProgressIndicator(),
                              ),
                            );
                          }
                          
                          final user = _users[index];
                          return _buildUserTile(user);
                        },
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildUserTile(User user) {
    return ListTile(
      leading: CircleAvatar(
        backgroundImage: user.profileImage != null
            ? CachedNetworkImageProvider(user.profileImage!)
            : null,
        child: user.profileImage == null
            ? Text(user.name.isNotEmpty ? user.name[0].toUpperCase() : '?')
            : null,
      ),
      title: Row(
        children: [
          Text(user.name),
          const SizedBox(width: 8),
          if (user.isStoreOwner)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.store.withOpacity(0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                'Store',
                style: TextStyle(fontSize: 10, color: AppColors.store),
              ),
            ),
        ],
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(user.email),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: _getRoleColor(user.role).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  user.role,
                  style: TextStyle(
                    fontSize: 10,
                    color: _getRoleColor(user.role),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Joined ${DateFormat('MMM d, yyyy').format(user.createdAt)}',
                style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
              ),
            ],
          ),
        ],
      ),
      trailing: PopupMenuButton<String>(
        onSelected: (value) {
          if (value == 'suspend') {
            _suspendUser(user);
          } else if (value.startsWith('role_')) {
            _updateUserRole(user, value.replaceFirst('role_', ''));
          }
        },
        itemBuilder: (context) => [
          const PopupMenuItem(value: 'role_user', child: Text('Set as User')),
          const PopupMenuItem(value: 'role_admin', child: Text('Set as Admin')),
          const PopupMenuItem(
            value: 'suspend',
            child: Text('Suspend', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
      isThreeLine: true,
    );
  }

  Widget _buildItemsTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: _itemSearchController,
            decoration: InputDecoration(
              hintText: 'Search items...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                icon: const Icon(Icons.search),
                onPressed: () => _loadItems(refresh: true),
              ),
            ),
            onSubmitted: (_) => _loadItems(refresh: true),
          ),
        ),
        Expanded(
          child: _isLoadingItems && _items.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : _items.isEmpty
                  ? const Center(child: Text('No items found'))
                  : RefreshIndicator(
                      onRefresh: () => _loadItems(refresh: true),
                      child: ListView.builder(
                        itemCount: _items.length + (_hasMoreItems ? 1 : 0),
                        itemBuilder: (context, index) {
                          if (index == _items.length) {
                            if (!_isLoadingItems) {
                              _loadItems();
                            }
                            return const Center(
                              child: Padding(
                                padding: EdgeInsets.all(16),
                                child: CircularProgressIndicator(),
                              ),
                            );
                          }
                          
                          final item = _items[index];
                          return _buildItemTile(item);
                        },
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildItemTile(Item item) {
    return ListTile(
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: item.images.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: item.images.first,
                width: 50,
                height: 50,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(
                  width: 50,
                  height: 50,
                  color: AppColors.divider,
                ),
                errorWidget: (_, __, ___) => Container(
                  width: 50,
                  height: 50,
                  color: AppColors.divider,
                  child: const Icon(Icons.image_not_supported, size: 24),
                ),
              )
            : Container(
                width: 50,
                height: 50,
                color: AppColors.divider,
                child: const Icon(Icons.shopping_basket),
              ),
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              item.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: item.isFree ? AppColors.free : AppColors.paid,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              item.priceDisplay,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${item.category} • Qty: ${item.quantity}',
            style: const TextStyle(fontSize: 12),
          ),
          Text(
            'Expires ${DateFormat('MMM d').format(item.expiryDate)}',
            style: TextStyle(
              fontSize: 11,
              color: item.isExpired ? AppColors.error : AppColors.textMuted,
            ),
          ),
        ],
      ),
      trailing: IconButton(
        icon: const Icon(Icons.delete_outline, color: AppColors.error),
        onPressed: () => _deleteItem(item),
      ),
      isThreeLine: true,
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Color _getRoleColor(String role) {
    switch (role) {
      case 'super_admin':
        return AppColors.error;
      case 'admin':
        return AppColors.warning;
      default:
        return AppColors.info;
    }
  }
}
