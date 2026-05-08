import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NewFile() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>P</Text>
      </View>

      <Text style={styles.title}>Phollet AI</Text>
      <Text style={styles.subtitle}>
        Khmer AI Assistant សម្រាប់ជួយឆ្លើយ Chat លក់ និង Support អតិថិជន
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚀 Features</Text>

        <Text style={styles.item}>✅ AI ឆ្លើយសារ 24 ម៉ោង</Text>
        <Text style={styles.item}>✅ សរសេរ Caption និង Ads Copy</Text>
        <Text style={styles.item}>✅ ជួយបិទការលក់</Text>
        <Text style={styles.item}>✅ Support ភាសាខ្មែរ / ថៃ / អង់គ្លេស</Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>ចាប់ផ្តើមប្រើឥឡូវនេះ</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    padding: 24,
    alignItems: "center",
  },
  logoBox: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: 18,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "800",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  item: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 10,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 999,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});