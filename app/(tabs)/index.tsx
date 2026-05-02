import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';
const features = [
  { icon: '💬', text: 'AI ជួយឆ្លើយ Chat' },
  { icon: '📈', text: 'AI ជួយលក់ផលិតផល' },
  { icon: '💰', text: 'AI ជួយរកលុយ 24/7' },
  { icon: '🤖', text: 'AI ភាសាខ្មែរ 100%' },
];

export default function HomeScreen() {
const router = useRouter();  return (
    <ThemedView style={styles.container}>

      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Khmer AI 🚀
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          សួស្តី! នេះជា AI App របស់អ្នក
        </ThemedText>
      </ThemedView>

      {/* Feature Cards */}
      <ThemedView style={styles.cardContainer}>
        {features.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => router.push('/chat')}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.icon}>{item.icon}</ThemedText>
            <ThemedText style={styles.cardText}>{item.text}</ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/chat')}
      >
        <ThemedText style={styles.buttonText}>
          ចាប់ផ្តើមប្រើ AI ឥឡូវ →
        </ThemedText>
      </TouchableOpacity>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 20,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  cardContainer: {
    width: '100%',
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    fontSize: 24,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a2e',
  },
  button: {
    backgroundColor: '#1877f2',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});