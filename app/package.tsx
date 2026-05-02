import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const packages = [
  {
    name: 'Free',
    price: '$0',
    priceNote: 'ឥតគិតថ្លៃ',
    icon: '🆓',
    color: '#f0f4ff',
    border: '#1877f2',
    features: [
      '✅ 15 សារ / ថ្ងៃ',
      '✅ AI ឆ្លាតវៃ ភាសាខ្មែរ',
      '✅ សរសេរ, បកប្រែ, គិត',
      '✅ ឆ្លើយសំណួរទូទៅ',
    ],
  },
  {
    name: 'Pro',
    price: '$5.99',
    priceNote: '/ខែ',
    icon: '💎',
    color: '#fff3e0',
    border: '#f59e0b',
    badge: '⭐ Popular',
    features: [
      '✅ ទាំង Free +',
      '✅ 200 សារ / ថ្ងៃ',
      '✅ ឆ្លើយលឿនជាង',
      '✅ Memory / ចាំ context',
      '✅ គ្មានផ្សាយពាណិជ្ជកម្ម',
    ],
  },
  {
    name: 'Pro+',
    price: '$13.99',
    priceNote: '/ខែ',
    icon: '🚀',
    color: '#f0e6ff',
    border: '#8b5cf6',
    badge: '🔥 Best Value',
    features: [
      '✅ ទាំង Pro +',
      '✅ គ្មានកំណត់សារ',
      '✅ Vision — មើលរូបភាព',
      '✅ Voice — ស្ដាប់សំឡេង',
      '✅ Model ឆ្លាតបំផុត',
      '✅ Priority Support',
    ],
  },
];

export default function PackageScreen() {
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← ត្រឡប់</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💎 Packages</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          ជ្រើសរើស Plan ដែលសមរម្យសម្រាប់អ្នក
        </Text>

        {packages.map((pkg, i) => (
          <View
            key={i}
            style={[
              styles.card,
              { backgroundColor: pkg.color, borderColor: pkg.border },
            ]}
          >
            {pkg.badge && (
              <View style={[styles.badge, { backgroundColor: pkg.border }]}>  
                <Text style={styles.badgeText}>{pkg.badge}</Text>
              </View>
            )}
            <Text style={styles.pkgIcon}>{pkg.icon}</Text>
            <Text style={styles.pkgName}>{pkg.name}</Text>
            <Text style={[styles.pkgPrice, { color: pkg.border }]}>
              {pkg.price}
              <Text style={styles.priceNote}>{pkg.priceNote}</Text>
            </Text>

            {pkg.features.map((f, j) => (
              <Text key={j} style={styles.feature}>{f}</Text>
            ))}

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: pkg.border }]}
            >
              <Text style={styles.btnText}>
                {pkg.price === '$0' ? 'ប្រើឥតគិតថ្លៃ' : `ជ្រើសរើស ${pkg.name} →`}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1877f2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  back: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    width: 60,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginTop: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    gap: 8,
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pkgIcon: {
    fontSize: 36,
    marginTop: 8,
  },
  pkgName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  pkgPrice: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  priceNote: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#888',
  },
  feature: {
    fontSize: 14,
    color: '#444',
    alignSelf: 'flex-start',
  },
  btn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});