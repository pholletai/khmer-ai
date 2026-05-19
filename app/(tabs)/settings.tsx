import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// ─── TYPES ───────────────────────────────────────
type SettingRowProps = {
  icon: string;
  label: string;
  value?: string;
  color?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
};

type Theme = {
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  primary: string;
};

// ─── COMPONENT ───────────────────────────────────
export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const T: Theme = {
    bg:      isDark ? '#0f1117' : '#f8fafc',
    card:    isDark ? '#1e2130' : '#ffffff',
    border:  isDark ? '#2d3148' : '#e2e8f0',
    text:    isDark ? '#e2e8f0' : '#1e293b',
    muted:   isDark ? '#94a3b8' : '#64748b',
    primary: '#6366f1',
  };

  const [notifications, setNotifications] = useState(true);
  const [soundEnabled,  setSoundEnabled]  = useState(true);

  // ─── ROW ───────────────────────────────────────
  const SettingRow = ({
    icon, label, value, color,
    onPress, toggle, toggleValue, onToggle,
  }: SettingRowProps) => {
    const iconColor = color ?? T.primary;

    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: T.border }]}
        onPress={onPress}
        activeOpacity={toggle ? 1 : 0.7}
        disabled={toggle && !onPress}
      >
        <View style={[styles.iconBox, { backgroundColor: iconColor + '22' }]}>
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>

        <Text style={[styles.label, { color: color ?? T.text }]}>{label}</Text>

        <View style={styles.right}>
          {toggle ? (
            <Switch
              value={toggleValue}
              onValueChange={onToggle}
              trackColor={{ false: T.border, true: T.primary }}
              thumbColor="#fff"
            />
          ) : (
            <>
              {!!value && (
                <Text style={[styles.value, { color: T.muted }]}>{value}</Text>
              )}
              <Ionicons name="chevron-forward" size={16} color={T.muted} />
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── HANDLERS ──────────────────────────────────
  const handleDeleteChats = () =>
    Alert.alert('លុប Chat?', 'តើបងចង់លុបប្រវត្តិ Chat ទាំងអស់មែនទេ?', [
      { text: 'បោះបង់', style: 'cancel' },
      {
        text: 'លុប',
        style: 'destructive',
        onPress: () => Alert.alert('រួចរាល់', 'បានលុប Chat ទាំងអស់'),
      },
    ]);

  // ─── RENDER ────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: T.bg }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: T.text }]}>ការកំណត់</Text>
        <Text style={[styles.subtitle, { color: T.muted }]}>
          គ្រប់គ្រងកម្មវិធី Khmer AI
        </Text>
      </View>

      {/* General */}
      <Text style={[styles.section, { color: T.muted }]}>ទូទៅ</Text>
      <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
        <SettingRow
          icon="notifications-outline"
          label="ការជូនដំណឹង"
          toggle toggleValue={notifications} onToggle={setNotifications}
        />
        <SettingRow
          icon="volume-medium-outline"
          label="សំឡេង"
          toggle toggleValue={soundEnabled} onToggle={setSoundEnabled}
        />
        <SettingRow
          icon="language-outline"
          label="ភាសា"
          value="ខ្មែរ / English"
          onPress={() => Alert.alert('ភាសា', 'ខ្មែរ / English')}
        />
      </View>

      {/* AI */}
      <Text style={[styles.section, { color: T.muted }]}>AI</Text>
      <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
        <SettingRow
          icon="sparkles-outline"
          label="AI Model"
          value="Claude AI"
          onPress={() => Alert.alert('AI Model', 'កំណត់ model សម្រាប់ AI')}
        />
        <SettingRow
          icon="trash-outline"
          label="លុប Chat ទាំងអស់"
          color="#ef4444"
          onPress={handleDeleteChats}
        />
      </View>

      {/* About */}
      <Text style={[styles.section, { color: T.muted }]}>អំពីកម្មវិធី</Text>
      <View style={[styles.card, { backgroundColor: T.card, borderColor: T.border }]}>
        <SettingRow
          icon="globe-outline"
          label="Website"
          value="khmerai.store"
          onPress={() => Linking.openURL('https://khmerai.store')}
        />
        <SettingRow
          icon="logo-telegram"
          label="Telegram"
          value="@PholletAI"
          color="#0088cc"
          onPress={() => Linking.openURL('https://t.me/PholletAI')}
        />
        <SettingRow
          icon="information-circle-outline"
          label="Version"
          value="1.0.0"
          onPress={() => Alert.alert('Version', 'Khmer AI v1.0.0')}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: T.muted }]}>
          Powered by Phollet AI 🇰🇭
        </Text>
      </View>
    </ScrollView>
  );
}

// ─── STYLES ──────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1 },
  header:      { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  title:       { fontSize: 30, fontWeight: '800' },
  subtitle:    { marginTop: 6, fontSize: 14, lineHeight: 22 },
  section: {
    marginTop: 18, marginBottom: 8,
    paddingHorizontal: 20,
    fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  card: {
    marginHorizontal: 16, borderRadius: 18,
    borderWidth: 1, overflow: 'hidden',
  },
  row: {
    minHeight: 64, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  label:  { flex: 1, fontSize: 16, fontWeight: '500' },
  right:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value:  { fontSize: 14 },
  footer: { paddingVertical: 32, alignItems: 'center' },
  footerText: { fontSize: 13 },
});