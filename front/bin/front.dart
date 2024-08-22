import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io';

void main(List<String> arguments) async {
  print("===== Login =====");
  stdout.write("Username: ");
  String? username = stdin.readLineSync()?.trim();
  stdout.write("Password: ");
  String? password = stdin.readLineSync()?.trim();
  final body = jsonEncode({"username": username, "password": password});
  final url = Uri.parse('http://localhost:3000/login');
  final response = await http.post(url,
      headers: {"Content-Type": "application/json"}, body: body);
  // if Login was ok
  if (response.statusCode == 200) {
    List user = jsonDecode(response.body);
    while (true) {
      print("\n========= Expense Tracking App ==========");
      print("Welcome ${user[0]["username"]}");
      print("1. All expenses");
      print("2. Today's expenses");
      print("3. Search expense");
      print("4. Add new expense");
      print("5. Delete an expense");
      print("6. Exit");
      stdout.write("Choose...");
      String? choice = stdin.readLineSync();
      if (choice == "6") {
        print("------Bye------");
        exit(0);
      } else if (choice == "3") {
        await searchExpense(user[0]["id"]);
      } else if (choice == "4") {
        await addExpense(user[0]["id"]);
      } else if (choice == "5") {
        await deleteExpense(user[0]["id"]);
      } else if (choice == "2") {
        await todayExpenses(user[0]['id']);
      } else if (choice == "1") {
        await showExpenses(user[0]['id']);
      } else {
        print("invalid input");
      }
    }
  } else {
    print(response.body);
  }
}

Future<void> showExpenses(int userId) async {
  final body = jsonEncode({"userID": userId});

  final url = Uri.parse('http://localhost:3000/expenses');
  final res = await http.post(url,
      headers: {"Content-Type": "application/json"}, body: body);
  print("-----------All expenses------------");
  //if getting expenses was okay..
  if (res.statusCode == 200) {
    final data = jsonDecode(res.body);
    final expenses = data['expenses'] as List;
    // List expenses = jsonDecode(res.body);
    final total = data['total'];
    for (int i = 0; i < expenses.length; i++) {
      print(
          "${expenses[i]["id"]}. ${expenses[i]["item"]} : ${expenses[i]["paid"]}฿ : ${expenses[i]["date"]}");
    }
    print("Total expenses = $total฿");
    print("");
  } else {
    print(res.body);
  }
  print("");
  return;
}

Future<void> todayExpenses(int userId) async {
  final body = jsonEncode({"userID": userId});
  final url = Uri.parse('http://localhost:3000/expense');
  final res = await http.post(url,
      headers: {"Content-Type": "application/json"}, body: body);
  print("-----------Today's expenses------------");
  //if getting expenses was okay..
  if (res.statusCode == 200) {
    final data = jsonDecode(res.body);
    final expenses = data['expenses'] as List;
    // List expenses = jsonDecode(res.body);
    final total = data['total'];
    for (int i = 0; i < expenses.length; i++) {
      print(
          "${expenses[i]["id"]}. ${expenses[i]["item"]} : ${expenses[i]["paid"]}฿ : ${expenses[i]["date"]}");
    }
    print("Total expenses = $total฿");
    print("");
  } else {
    print(res.body);
  }
  print("");
  return;
}

Future<void> searchExpense(int userID) async {
  stdout.write("Item to search: ");
  String? toSearch = stdin.readLineSync()?.trim();

  final body = jsonEncode({"toSearch": toSearch, "userID": userID});
  final url = Uri.parse('http://localhost:3000/searchExpense');
  final res = await http.post(url,
      headers: {"Content-Type": "application/json"}, body: body);

  if (res.statusCode == 200) {
    List expenses = jsonDecode(res.body);
    if (expenses.isEmpty) {
      print("No expenses found for item: $toSearch");
    } else {
      for (int i = 0; i < expenses.length; i++) {
        print(
            "${expenses[i]["id"]}. ${expenses[i]["item"]} : ${expenses[i]["paid"]}฿ : ${expenses[i]["formatted_date"]}");
      }
    }
  } else {
    print("No item: ${toSearch}");
  }
}

Future<void> deleteExpense(int userId) async {
  print("==== Delete an item ====");
  stdout.write("Item id: ");
  String? itemId = stdin.readLineSync()?.trim();

  if (itemId == null || itemId == "") {
    print("Invalid input for Item id!");
    return;
  } else if (int.tryParse(itemId) == null) {
    print("Invalid input for Item id!");
    return;
  } else {
    final body = jsonEncode({"userID": userId, "itemID": itemId});
    final url = Uri.parse('http://localhost:3000/expense');
    final response = await http.delete(url,
        headers: {"Content-Type": "application/json"}, body: body);

    final result = json.decode(response.body) as Map;

    if (response.statusCode == 200) {
      print(result["message"]);
      print("");
      return;
    } else if (response.statusCode == 401) {
      print(result["message"]);
      print("Try Again");
      print("");
      await deleteExpense(userId);
      return;
    } else if (response.statusCode == 500) {
      print(result["message"]);
      return;
    } else {
      print("Unknown error");
      return;
    }
  }
}

Future<void> addExpense(int userID) async {
  print("===== Add new item =====");
  stdout.write("Item: ");
  String? item = stdin.readLineSync()?.trim();
  stdout.write("Paid: ");
  String? paid = stdin.readLineSync()?.trim();
  if (item == "" || paid == "" || paid == null) {
    print("invalid input");
    print("Try Again!");
    await addExpense(userID);
  } else if (int.tryParse(paid) == null) {
    print("paid value must be number");
    print("Try Again!");
    await addExpense(userID);
  } else {
    final body = jsonEncode({"userID": userID, "paid": paid, "item": item});
    final url = Uri.parse('http://localhost:3000/addExpense');
    final response = await http.post(url,
        headers: {"Content-Type": "application/json"}, body: body);
    if (response.statusCode == 200) {
      print("Inserted!");
    } else {
      print("Failed to add expense.");
    }
    return;
  }
}
