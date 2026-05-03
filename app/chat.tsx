import { useColorScheme } from '@/hooks/use-color-scheme';
import { askAI } from '@/services/ai';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  text: string;
  role: 'user' | 'ai';
  image?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

// ─── Storage (web: localStorage, native: in-memory) ──────────────────────────
const mem: Record<string, string> = {};
const store = {
  get: (k: string): string | null => {
    if (Platform.OS === 'web') { try { return localStorage.getItem(k); } catch {} }
    return mem[k] ?? null;
  },
  set: (k: string, v: string): void => {
    if (Platform.OS === 'web') { try { localStorage.setItem(k, v); } catch {} }
    mem[k] = v;
  },
};
const HISTORY_KEY = 'khmer_ai_history';

// ─── Quick prompts ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: '✍️', text: 'សរសេរ Caption' },
  { icon: '🌐', text: 'បកប្រែភាសា' },
  { icon: '💻', text: 'សរសេរ Code' },
  { icon: '🖼️', text: 'បង្កើតរូបភាព' },
  { icon: '🛒', text: 'សរសេរឆ្លើយលក់' },
  { icon: '📢', text: 'សរសេរ Ads' },
  { icon: '🧠', text: 'សង្ខេបអត្ថបទ' },
  { icon: '📩', text: 'សរសេរ Email' },
  { icon: '🎯', text: 'គំនិត Marketing' },
  { icon: '💬', text: 'ឆ្លើយ Comment' },

  // Extra options — អាចប្រើសម្រាប់ version expand ឬ category ផ្សេងៗ
  { icon: '🤖', text: 'សរសេរ Chatbot Script' },
  { icon: '📊', text: 'វិភាគទិន្នន័យ' },
  { icon: '🤝', text: 'Follow Up អតិថិជន' },
  { icon: '📋', text: 'សរសេរ Proposal' },
  { icon: '🎬', text: 'Script វីដេអូ' },
  { icon: '🔑', text: 'Keywords SEO' },
];


// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  light: {
    bg: '#FFFFFF', sidebar: '#F9F9F9', border: '#E5E7EB',
    text: '#0D0D0D', muted: '#6B7280', placeholder: '#9CA3AF',
    inputBg: '#F3F4F6', inputBorder: '#D1D5DB',
    userBubble: '#F3F4F6', userText: '#0D0D0D', aiText: '#0D0D0D',
    cardBg: '#F9FAFB', cardBorder: '#E5E7EB',
    activeSession: '#EBF3FF', primary: '#1877F2',
    overlay: 'rgba(0,0,0,0.35)',
  },
  dark: {
    bg: '#212121', sidebar: '#171717', border: '#2F2F2F',
    text: '#ECECEC', muted: '#8E8EA0', placeholder: '#6B7280',
    inputBg: '#2F2F2F', inputBorder: '#3F3F3F',
    userBubble: '#2F2F2F', userText: '#ECECEC', aiText: '#ECECEC',
    cardBg: '#2A2A2A', cardBorder: '#3A3A3A',
    activeSession: '#1E3A5F', primary: '#3B9EFF',
    overlay: 'rgba(0,0,0,0.65)',
  },
} as const;

const SIDEBAR_W = 260;
// ដាក់នៅចន្លោះបន្ទាត់ 95-97 (មុន start function ChatScreen)
interface PromptProps {
  icon: string;
  text: string;
  col: any; // ឬដាក់ឱ្យចំតាម Type ពណ៌របស់ប្អូន
  onPress: () => void;
}

const PromptChip = ({ icon, text, col, onPress }: PromptProps) => (
  <TouchableOpacity 
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: col.cardBg,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: col.cardBorder,
      margin: 4,
    }}>
    <Text style={{ fontSize: 16, marginRight: 6 }}>{icon}</Text>
    <Text style={{ color: col.text, fontSize: 13 }}>{text}</Text>
  </TouchableOpacity>
);
// ─── Component ────────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const col = isDark ? C.dark : C.light;
  const insets = useSafeAreaInsets();
  const isWide = width >= 768;

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const slideX = useRef(new Animated.Value(-SIDEBAR_W)).current;

  // Data
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dots, setDots] = useState('');
  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Load history
  useEffect(() => {
    const raw = store.get(HISTORY_KEY);
    if (raw) {
      try {
        const parsed: ChatSession[] = JSON.parse(raw);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveId(parsed[0].id);
          setMessages(parsed[0].messages);
        }
      } catch {}
    }
  }, []);

  // Loading dots animation
  useEffect(() => {
    if (!loading) { setDots(''); return; }
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 450);
    return () => clearInterval(t);
  }, [loading]);

  // Sidebar animation
  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
    Animated.spring(slideX, { toValue: 0, useNativeDriver: true, tension: 120, friction: 18 }).start();
  }, [slideX]);

  const closeSidebar = useCallback(() => {
    Animated.spring(slideX, { toValue: -SIDEBAR_W, useNativeDriver: true, tension: 120, friction: 18 }).start(
      () => setSidebarOpen(false)
    );
  }, [slideX]);

  // Persist
  const persist = useCallback((s: ChatSession[]) => {
    store.set(HISTORY_KEY, JSON.stringify(s));
  }, []);

  // New chat
  const newChat = useCallback(() => {
    const id = `${Date.now()}`;
    const session: ChatSession = { id, title: 'Chat ថ្មី', messages: [], updatedAt: Date.now() };
    const next = [session, ...sessions];
    setSessions(next);
    setActiveId(id);
    setMessages([]);
    persist(next);
    if (!isWide) closeSidebar();
    setTimeout(() => inputRef.current?.focus(), 300);
  }, [sessions, persist, isWide, closeSidebar]);

  // Select session
  const selectSession = useCallback((id: string) => {
    const s = sessions.find(x => x.id === id);
    if (s) { setActiveId(id); setMessages(s.messages); }
    if (!isWide) closeSidebar();
  }, [sessions, isWide, closeSidebar]);

  // Send
  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput('');

    // Ensure we have a session
    let sid = activeId;
    let curSessions = sessions;
    if (!sid) {
      const id = `${Date.now()}`;
      const session: ChatSession = { id, title: trimmed.slice(0, 30), messages: [], updatedAt: Date.now() };
      curSessions = [session, ...sessions];
      setSessions(curSessions);
      setActiveId(id);
      sid = id;
    }

    const userMsg: Message = { id: `u${Date.now()}`, text: trimmed, role: 'user' };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setLoading(true);

    const s1 = curSessions.map(s =>
      s.id === sid
        ? { ...s, messages: withUser, title: s.messages.length === 0 ? trimmed.slice(0, 30) : s.title, updatedAt: Date.now() }
        : s
    );
    setSessions(s1);
    persist(s1);

    try {
      const reply = await askAI('web-user', trimmed);
      const aiMsg: Message = { id: `a${Date.now()}`, text: reply, role: 'ai' };
      const withAi = [...withUser, aiMsg];
      setMessages(withAi);
      const s2 = s1.map(s => s.id === sid ? { ...s, messages: withAi, updatedAt: Date.now() } : s);
      setSessions(s2);
      persist(s2);
    } catch (err: any) {
      const errMsg: Message = { id: `e${Date.now()}`, text: `⚠️ ${err.message || 'មានបញ្ហា'}`, role: 'ai' };
      const withErr = [...withUser, errMsg];
      setMessages(withErr);
      const s2 = s1.map(s => s.id === sid ? { ...s, messages: withErr } : s);
      setSessions(s2);
      persist(s2);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [activeId, sessions, messages, loading, persist]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { alert('ត្រូវការសិទ្ធិចូលប្រើរូបភាព'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      sendImageMessage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { alert('ត្រូវការសិទ្ធិចូលប្រើកាមេរ៉ា'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      sendImageMessage(result.assets[0].uri);
    }
  };

  const sendImageMessage = (imageUri: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: '📷 បានផ្ញើរូបភាព', image: imageUri };
    setMessages((prev) => [...prev, userMsg]);
    setSelectedImage(null);
  };

  const toggleVoice = () => {
    setIsRecording((prev) => !prev);
  };

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages.length]);

  const filtered = sessions.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  // ─── Sidebar content (shared between desktop/mobile) ─────────────────────
  const sidebarContent = (
    <View style={[styles.sidebar, { backgroundColor: col.sidebar, borderRightColor: col.border, paddingTop: insets.top }]}>
      {/* Logo */}
      <View style={styles.logoRow}>
        <View style={[styles.logoIconWrap, { backgroundColor: col.primary }]}>
          <Text style={styles.logoEmoji}>🤖</Text>
        </View>
        <Text style={[styles.logoText, { color: col.text }]}>Khmer AI</Text>
        {!isWide && (
          <TouchableOpacity onPress={closeSidebar} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={col.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* New Chat */}
      <TouchableOpacity style={[styles.newChatBtn, { borderColor: col.border, backgroundColor: col.cardBg }]} onPress={newChat} activeOpacity={0.7}>
        <Ionicons name="add" size={18} color={col.primary} />
        <Text style={[styles.newChatLabel, { color: col.primary }]}>Chat ថ្មី</Text>
      </TouchableOpacity>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: col.inputBg, borderColor: col.border }]}>
        <Ionicons name="search" size={14} color={col.muted} />
        <TextInput
          style={[styles.searchInput, { color: col.text }]}
          placeholder="ស្វែងរក..."
          placeholderTextColor={col.placeholder}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* History label */}
      <Text style={[styles.sectionLabel, { color: col.muted }]}>ប្រវត្តិ Chat</Text>

      {/* Sessions list */}
      <ScrollView style={styles.sessionScroll} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Text style={[styles.emptyHint, { color: col.muted }]}>
            {search ? 'រកមិនឃើញ' : 'មិនទាន់មាន Chat'}
          </Text>
        ) : filtered.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sessionItem, activeId === s.id && { backgroundColor: col.activeSession }]}
            onPress={() => selectSession(s.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={col.muted} style={styles.sessionIcon} />
            <Text style={[styles.sessionTitle, { color: col.text }]} numberOfLines={1}>{s.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom */}
      <View style={[styles.sidebarBottom, { borderTopColor: col.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/package')} activeOpacity={0.85}>
          <Ionicons name="flash" size={15} color="#fff" />
          <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
        </TouchableOpacity>
        <View style={styles.profileRow}>
          <View style={[styles.avatarCircle, { backgroundColor: col.primary }]}>
            <Text style={styles.avatarLetter}>K</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: col.text }]}>Khmer User</Text>
            <Text style={[styles.profilePlan, { color: col.muted }]}>Free Plan</Text>
          </View>
          <Ionicons name="ellipsis-horizontal" size={16} color={col.muted} />
        </View>
      </View>
    </View>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: col.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={col.bg} />

      {/* Desktop sidebar (permanent column) */}
      {isWide && sidebarContent}

      {/* Mobile sidebar (absolute drawer) */}
      {!isWide && (
        <>
          {sidebarOpen && (
            <Pressable
              style={[StyleSheet.absoluteFill, { backgroundColor: col.overlay, zIndex: 50 }]}
              onPress={closeSidebar}
            />
          )}
          {sidebarOpen && (
            <Animated.View
              style={[
                styles.mobileSidebar,
                { transform: [{ translateX: slideX }], zIndex: 100 },
              ]}
            >
              {sidebarContent}
            </Animated.View>
          )}
        </>
      )}

      {/* Main area */}
      <KeyboardAvoidingView
        style={styles.main}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Top bar */}
        <View style={[styles.topBar, { backgroundColor: col.bg, borderBottomColor: col.border, paddingTop: insets.top }]}>
          <TouchableOpacity onPress={openSidebar} style={styles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            {isWide
              ? <Ionicons name="chevron-forward" size={22} color={col.muted} />
              : <Ionicons name="menu" size={24} color={col.text} />}
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: col.text }]} numberOfLines={1}>
            {activeId ? (sessions.find(s => s.id === activeId)?.title ?? 'Khmer AI') : 'Khmer AI'}
          </Text>
          <TouchableOpacity onPress={newChat} style={styles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="create-outline" size={22} color={col.text} />
          </TouchableOpacity>
        </View>

        {/* Messages or welcome */}
        {messages.length === 0 ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.welcomeWrap}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.welcomeInner}>
              <View style={[styles.welcomeIconBg, { backgroundColor: isDark ? '#1E3A5F' : '#EBF3FF' }]}>
                <Text style={styles.welcomeIconEmoji}>🤖</Text>
              </View>
              <Text style={[styles.welcomeTitle, { color: col.text }]}>ថ្ងៃនេះបងចង់ធ្វើអ្វី?</Text>
              <Text style={[styles.welcomeSub, { color: col.muted }]}>Khmer AI ជួយអ្នកបានគ្រប់បែបយ៉ាង</Text>
              <View style={styles.promptGrid}>
              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                justifyContent: 'center', 
                padding: 8 
              }}>
               {QUICK_PROMPTS.map((item, index) => (
                <PromptChip 
                 key={index}
                 icon={item.icon}
                 text={item.text}
                 col={col}
                 onPress={() => send(item.text)}
                />
              ))}
              </View>   
    
              </View>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={styles.msgList}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map(msg => (
              <View key={msg.id} style={[styles.msgRow, msg.role === 'user' ? styles.msgRowUser : styles.msgRowAi]}>
                {msg.role === 'ai' && (
                  <View style={[styles.aiAvatar, { backgroundColor: col.primary }]}>
                    <Text style={styles.aiAvatarText}>K</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    msg.role === 'user'
                      ? [styles.userBubble, { backgroundColor: col.userBubble }]
                      : styles.aiBubble,
                    { maxWidth: isWide ? '65%' : '82%' },
                  ]}
                >
                  <Text style={[styles.bubbleText, { color: msg.role === 'user' ? col.userText : col.aiText }]}>
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}

            {loading && (
              <View style={[styles.msgRow, styles.msgRowAi]}>
                <View style={[styles.aiAvatar, { backgroundColor: col.primary }]}>
                  <Text style={styles.aiAvatarText}>K</Text>
                </View>
                <View style={[styles.bubble, styles.aiBubble]}>
                  <Text style={[styles.loadingText, { color: col.muted }]}>Khmer AI កំពុងគិត{dots}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {/* Input */}
        <View style={[styles.inputArea, { backgroundColor: col.bg, borderTopColor: col.border, paddingBottom: Math.max(insets.bottom, 8) }]}>

          {selectedImage && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
                <Ionicons name="close-circle" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.inputRow, { backgroundColor: col.inputBg }]}>
            <TouchableOpacity style={styles.iconBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color={col.placeholder} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn} onPress={takePhoto}>
              <Ionicons name="camera-outline" size={24} color={col.placeholder} />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: col.text }]}
              placeholder="វាយសារ..."
              placeholderTextColor={col.placeholder}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => send(input)}
              returnKeyType="send"
              multiline
            />

            {input.trim() ? (
              <TouchableOpacity style={[styles.sendBtn, { backgroundColor: col.primary }]} onPress={() => send(input)}>
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.iconBtn, isRecording && styles.recordingBtn]} onPress={toggleVoice}>
                <Ionicons
                  name={isRecording ? 'mic' : 'mic-outline'}
                  size={24}
                  color={isRecording ? '#ef4444' : col.placeholder}
                />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.disclaimer, { color: col.muted }]}>Khmer AI អាចធ្វើ​ឱ្យ​មាន​កំ​ហុស​បាន</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: {
    width: SIDEBAR_W,
    flexShrink: 0,
    borderRightWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'column',
  },
  mobileSidebar: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: SIDEBAR_W,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 10 },
  logoIconWrap: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  logoEmoji: { fontSize: 18 },
  logoText: { fontSize: 17, fontWeight: '700', flex: 1 },
  closeBtn: { padding: 4 },
  newChatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, marginBottom: 10,
  },
  newChatLabel: { fontSize: 14, fontWeight: '600' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 13, padding: 0 },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6, marginLeft: 4 },
  sessionScroll: { flex: 1 },
  sessionItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 9, paddingHorizontal: 10,
    borderRadius: 8, marginBottom: 2,
  },
  sessionIcon: { marginRight: 8, flexShrink: 0 },
  sessionTitle: { fontSize: 13, flex: 1 },
  emptyHint: { fontSize: 13, textAlign: 'center', marginTop: 20, paddingHorizontal: 8 },
  sidebarBottom: { borderTopWidth: 1, paddingTop: 12, gap: 8 },
  upgradeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#1877F2', paddingVertical: 11, borderRadius: 10,
  },
  upgradeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 15, fontWeight: '700' },
  profileInfo: { flex: 1, marginLeft: 10 },
  profileName: { fontSize: 13, fontWeight: '600' },
  profilePlan: { fontSize: 11, marginTop: 1 },

  // Top bar
  main: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, minHeight: 50,
  },
  menuBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  topBarTitle: { flex: 1, fontSize: 15, fontWeight: '600', textAlign: 'center', marginHorizontal: 8 },

  // Welcome
  welcomeWrap: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  welcomeInner: { width: '100%', maxWidth: 520, alignItems: 'center' },
  welcomeIconBg: { width: 72, height: 72, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  welcomeIconEmoji: { fontSize: 38 },
  welcomeTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  welcomeSub: { fontSize: 15, textAlign: 'center', marginBottom: 32 },
  promptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', width: '100%' },
  promptCard: {
    width: '47%', padding: 14, borderRadius: 14, borderWidth: 1,
    alignItems: 'flex-start', gap: 6,
  },
  promptIcon: { fontSize: 22 },
  promptText: { fontSize: 13, fontWeight: '500', lineHeight: 18 },

  // Messages
  msgList: { padding: 16, gap: 8, paddingBottom: 24 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAi: { justifyContent: 'flex-start' },
  aiAvatar: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginBottom: 2 },
  aiAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { borderBottomRightRadius: 4 },
  aiBubble: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 23 },
  loadingText: { fontSize: 14, fontStyle: 'italic' },

  // Input
  inputArea: { paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    borderRadius: 24, paddingHorizontal: 6, paddingVertical: 4, minHeight: 48,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  recordingBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  textInput: { flex: 1, fontSize: 16, maxHeight: 100, paddingHorizontal: 8, paddingVertical: 8 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  imagePreview: { marginBottom: 8, position: 'relative', alignSelf: 'flex-start' },
  previewImage: { width: 80, height: 80, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 11 },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: 6, marginBottom: 2 },
});
