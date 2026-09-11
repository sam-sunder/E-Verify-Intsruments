import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/network/api_client.dart';

class UserListScreen extends StatefulWidget {
  const UserListScreen({super.key});

  @override
  State<UserListScreen> createState() => _UserListScreenState();
}

class _UserListScreenState extends State<UserListScreen> {
  late ApiClient _apiClient;
  List<Map<String, dynamic>> _users = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _searchQuery = '';
  String _roleFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    _apiClient = context.read<ApiClient>();
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      Map<String, String> params = {};
      if (_searchQuery.isNotEmpty) params['query'] = _searchQuery;
      if (_roleFilter != 'ALL') params['role'] = _roleFilter;

      final response = await _apiClient.request<Map<String, dynamic>>(
        path: '/admin/users',
        method: 'GET',
        queryParams: params,
      );
      _users = (response['data'] as List).cast<Map<String, dynamic>>();
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleUserStatus(String userId, bool activate) async {
    try {
      final path = activate ? '/admin/users/$userId/activate' : '/admin/users/$userId/deactivate';
      await _apiClient.request(path: path, method: 'POST');
      _loadUsers();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('User ${activate ? 'activated' : 'deactivated'} successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Action failed: ${e.toString()}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('User Management'),
        actions: [
          PopupMenuButton<String>(
            onSelected: (val) {
              setState(() => _roleFilter = val);
              _loadUsers();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'ALL', child: Text('All Roles')),
              const PopupMenuItem(value: 'ADMINISTRATOR', child: Text('Administrators')),
              const PopupMenuItem(value: 'OFFICER', child: Text('Officers')),
              const PopupMenuItem(value: 'BUSINESS_OWNER', child: Text('Business Owners')),
            ],
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadUsers,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Search users...',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(30)),
                  filled: true,
                  fillColor: Colors.white,
                ),
                onChanged: (val) {
                  setState(() => _searchQuery = val);
                  _loadUsers();
                },
              ),
            ),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_errorMessage!),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadUsers, child: const Text('Retry')),
          ],
        ),
      );
    }

    if (_users.isEmpty) {
      return const Center(child: Text('No users found.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: _users.length,
      itemBuilder: (context, index) {
        final user = _users[index];
        final bool isActive = user['status'] == 'ACTIVE';

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: Colors.grey.shade300),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            title: Text(user['fullName'], style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user['email']),
                Text('Role: ${user['role']}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
              ],
            ),
            trailing: Switch(
              value: isActive,
              onChanged: (val) => _toggleUserStatus(user['id'], val),
              activeThumbColor: Colors.teal,
            ),
          ),
        );
      },
    );
  }
}
