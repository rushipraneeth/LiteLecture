import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Voice from '@react-native-voice/voice';
import { LinearGradient } from 'expo-linear-gradient';
import { Provider as PaperProvider, Card, Button, Title, Paragraph, Avatar, ProgressBar } from 'react-native-paper';

/* -------------------- STYLES -------------------- */
const stylesLight = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E4E7',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    maxWidth: 200,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  smallText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 8,
  },
  largeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyText: {
    flex: 1,
    marginLeft: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  historySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  actionButtonText: {
    color: '#3730A3',
    fontWeight: '600',
    fontSize: 14,
  },
});

const stylesDark = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#60A5FA',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    maxWidth: 200,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    lineHeight: 20,
  },
  smallText: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  largeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F9FAFB',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#374151',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#F9FAFB',
    backgroundColor: '#374151',
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#F9FAFB',
    backgroundColor: '#374151',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#2D3748',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#4A5568',
  },
  historyText: {
    flex: 1,
    marginLeft: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F7FAFC',
  },
  historySubtitle: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 2,
  },
  actionButton: {
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#DBEAFE',
    fontWeight: '600',
    fontSize: 14,
  },
});

/* -------------------- TEXT UTILS -------------------- */
const simpleExtractiveSummarizer = (text, sentenceCount = 3) => {
  if (!text || text.trim().length === 0) return '';
  const stopwords = new Set([
    'the','is','in','and','to','of','a','that','it','on','for','with','as','this','was','are','be','by','an','or','from','at','we','you','i'
  ]);
  const sentences = text.replace(/\n/g, ' ').split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(Boolean);
  if (sentences.length <= sentenceCount) return sentences.join(' ');

  const freq = {};
  text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean).forEach((w) => {
    if (stopwords.has(w)) return;
    freq[w] = (freq[w] || 0) + 1;
  });

  const sentenceScores = sentences.map((s) => {
    const words = s.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
    let score = 0;
    words.forEach((w) => { if (freq[w]) score += freq[w]; });
    return { s, score };
  });

  sentenceScores.sort((a, b) => b.score - a.score);
  const top = sentenceScores.slice(0, sentenceCount).map(x => x.s);
  return top.join(' ');
};

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generateFillInTheBlankQuestions = (text, count = 5) => {
  if (!text || text.trim().length === 0) return [];
  const sentences = text.replace(/\n/g, ' ').split(/(?<=[.?!])\s+/).map(s => s.trim()).filter(s => s.length > 20);
  if (sentences.length === 0) return [];

  const wordsAll = text.replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
  const uniqueWords = Array.from(new Set(wordsAll)).slice(0, 400);

  const qs = [];
  for (let i = 0; i < Math.min(count, sentences.length); i++) {
    const sent = sentences[i % sentences.length];
    const words = sent.replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
    if (!words.length) continue;
    const candidate = words[Math.floor(Math.random() * words.length)];
    const correct = candidate;
    const distractors = [];
    const pool = uniqueWords.filter(w => w.toLowerCase() !== correct.toLowerCase());
    for (let k = 0; k < 3 && pool.length; k++) {
      const idx = Math.floor(Math.random() * pool.length);
      distractors.push(pool.splice(idx, 1)[0]);
    }
    const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
    const questionText = sent.replace(new RegExp(`\\b${escapeRegExp(correct)}\\b`), '____');
    qs.push({ id: i + 1, question: questionText, answer: correct, options, userAnswer: null });
  }
  return qs;
};

/* -------------------- MAIN APP -------------------- */
const HISTORY_KEY_PREFIX = 'history:';

export default function App() {
  // Theme
  const [darkMode, setDarkMode] = useState(false);
  const theme = darkMode ? stylesDark : stylesLight;

  // Auth
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authUser, setAuthUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Audio
  const [audioUri, setAudioUri] = useState(null);
  const [audioName, setAudioName] = useState(null);
  const [soundObj, setSoundObj] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingSound, setLoadingSound] = useState(false);

  // Recording
  const recordingRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLoading, setRecordingLoading] = useState(false);

  // Speech-to-Text (Voice) - Enhanced from first code
  const [liveTranscript, setLiveTranscript] = useState('');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  // Quiz
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);

  // History
  const [history, setHistory] = useState([]);

  /* ------------------ INITIALIZATION ------------------ */
  useEffect(() => {
    (async () => {
      const lastUser = await AsyncStorage.getItem('lastUser');
      if (lastUser) {
        setAuthUser(lastUser);
        setIsSignedIn(true);
        setShowAuthModal(false);
        await loadHistoryForUser(lastUser);
      } else {
        setShowAuthModal(true);
      }
    })();

    // Voice event handlers
    Voice.onSpeechResults = onVoiceResults;
    Voice.onSpeechError = onVoiceError;

    return () => {
      if (soundObj) soundObj.unloadAsync?.();
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync?.();
      Voice.destroy().then(Voice.removeAllListeners).catch(() => {});
    };
  }, []);

  /* ------------------ VOICE HANDLERS ------------------ */
  const onVoiceResults = (e) => {
    if (e && e.value && e.value.length) {
      const newText = e.value.join(' ');
      setLiveTranscript((prev) => {
        const merged = (prev ? prev + ' ' : '') + newText;
        return merged.trim();
      });
    }
  };

  const onVoiceError = (e) => {
    console.warn('Voice error', e);
  };

  /* ------------------ AUTH HELPERS ------------------ */
  const getUsers = useCallback(async () => {
    const raw = await AsyncStorage.getItem('users');
    return raw ? JSON.parse(raw) : {};
  }, []);

  const saveUsers = useCallback(async (users) => {
    await AsyncStorage.setItem('users', JSON.stringify(users));
  }, []);

  const handleSignup = useCallback(async () => {
    if (!usernameInput.trim() || !passwordInput) {
      Alert.alert('Signup', 'Provide username and password.');
      return;
    }
    setLoadingAuth(true);
    try {
      const users = await getUsers();
      if (users[usernameInput]) {
        Alert.alert('Signup', 'Username already taken.');
        return;
      }
      users[usernameInput] = passwordInput;
      await saveUsers(users);
      setIsSignedIn(true);
      setAuthUser(usernameInput);
      await AsyncStorage.setItem('lastUser', usernameInput);
      await loadHistoryForUser(usernameInput);
      setShowAuthModal(false);
      setUsernameInput('');
      setPasswordInput('');
      Alert.alert('Signup', 'Account created and signed in.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not create account.');
    } finally {
      setLoadingAuth(false);
    }
  }, [usernameInput, passwordInput, getUsers, saveUsers]);

  const handleLogin = useCallback(async () => {
    if (!usernameInput.trim() || !passwordInput) {
      Alert.alert('Login', 'Provide username and password.');
      return;
    }
    setLoadingAuth(true);
    try {
      const users = await getUsers();
      if (users[usernameInput] && users[usernameInput] === passwordInput) {
        setIsSignedIn(true);
        setAuthUser(usernameInput);
        await AsyncStorage.setItem('lastUser', usernameInput);
        await loadHistoryForUser(usernameInput);
        setShowAuthModal(false);
        setUsernameInput('');
        setPasswordInput('');
        Alert.alert('Login', 'Signed in.');
      } else {
        Alert.alert('Login', 'Invalid credentials.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not log in.');
    } finally {
      setLoadingAuth(false);
    }
  }, [usernameInput, passwordInput, getUsers]);

  const handleSignOut = useCallback(async () => {
    setIsSignedIn(false);
    setAuthUser(null);
    setHistory([]);
    await AsyncStorage.removeItem('lastUser');
    setShowAuthModal(true);
  }, []);

  /* ------------------ HISTORY ------------------ */
  const loadHistoryForUser = useCallback(async (username) => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY_PREFIX + username);
      const arr = raw ? JSON.parse(raw) : [];
      setHistory(arr);
    } catch (e) {
      console.warn('loadHistoryForUser', e);
      setHistory([]);
    }
  }, []);

  const addToHistory = useCallback(async (entry) => {
    if (!isSignedIn || !authUser) return;
    const key = HISTORY_KEY_PREFIX + authUser;
    const raw = await AsyncStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(entry);
    await AsyncStorage.setItem(key, JSON.stringify(arr));
    setHistory(arr);
  }, [authUser, isSignedIn]);

  /* ------------------ FILE PICKING ------------------ */
  const pickAudioFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/aac'],
        copyToCacheDirectory: false, // we'll handle copying
        multiple: false,
      });
      
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      
      const file = res.assets[0];
      let finalUri = file.uri;
      const fileName = file.name || `imported-${Date.now()}.mp3`;
      
      // On Android the URI may be content://; on iOS it's usually file://
      // Try to get file into app cache so expo-av can use it reliably
      if (!finalUri.startsWith(FileSystem.cacheDirectory) && !finalUri.startsWith('file://')) {
        // Attempt to read as base64 and write into cache
        try {
          console.log('Reading file from content URI:', finalUri);
          const b64 = await FileSystem.readAsStringAsync(finalUri, { encoding: FileSystem.EncodingType.Base64 });
          const dest = FileSystem.cacheDirectory + fileName;
          await FileSystem.writeAsStringAsync(dest, b64, { encoding: FileSystem.EncodingType.Base64 });
          finalUri = dest;
          console.log('Successfully copied to cache:', finalUri);
        } catch (e) {
          // fallback: try to copy using copyAsync if available
          try {
            const dest = FileSystem.cacheDirectory + fileName;
            await FileSystem.copyAsync({ from: finalUri, to: dest });
            finalUri = dest;
            console.log('Successfully copied using copyAsync:', finalUri);
          } catch (e2) {
            // final fallback: try to download (works for http(s))
            try {
              const dest = FileSystem.cacheDirectory + fileName;
              await FileSystem.downloadAsync(finalUri, dest);
              finalUri = dest;
              console.log('Successfully downloaded:', finalUri);
            } catch (e3) {
              console.error('pickAudioFile: unable to copy content URI', e, e2, e3);
              Alert.alert('Import failed', 'Could not import selected audio file. Please try a different file or method.');
              return;
            }
          }
        }
      } else if (finalUri.startsWith(FileSystem.cacheDirectory)) {
        // already in cache
        console.log('File already in cache:', finalUri);
      } else if (!finalUri.startsWith('file://')) {
        // Try prefixing file:// on some systems
        finalUri = 'file://' + finalUri;
        console.log('Added file:// prefix:', finalUri);
      }

      // Verify the file exists and is accessible
      try {
        const fileInfo = await FileSystem.getInfoAsync(finalUri);
        if (!fileInfo.exists) {
          throw new Error('File does not exist at final URI');
        }
        console.log('File verified, size:', fileInfo.size, 'bytes');
      } catch (e) {
        console.error('File verification failed:', e);
        Alert.alert('Import failed', 'The imported file could not be accessed. Please try again.');
        return;
      }

      // Save state
      setAudioUri(finalUri);
      setAudioName(fileName);
      setTranscript(''); // reset transcript for this audio
      setSummary('');
      // unload previous sound
      if (soundObj) {
        await soundObj.unloadAsync();
        setSoundObj(null);
        setIsPlaying(false);
      }

      // Optionally store in history for signed-in users (store metadata and local uri)
      if (isSignedIn && authUser) {
        // get duration if possible
        try {
          const s = new Audio.Sound();
          await s.loadAsync({ uri: finalUri });
          const status = await s.getStatusAsync();
          const durationSec = status.durationMillis ? Math.round(status.durationMillis / 1000) : null;
          await s.unloadAsync();
          const entry = {
            id: 'h' + Date.now(),
            name: fileName,
            uri: finalUri,
            ts: Date.now(),
            duration: durationSec,
            transcript: null,
            summary: null,
          };
          await addToHistory(entry);
          console.log('Added to history with duration:', durationSec);
        } catch (e) {
          // if we can't load duration, still add (without duration)
          console.warn('Could not get duration:', e);
          const entry = {
            id: 'h' + Date.now(),
            name: fileName,
            uri: finalUri,
            ts: Date.now(),
            duration: null,
            transcript: null,
            summary: null,
          };
          await addToHistory(entry);
        }
      }
      
      Alert.alert('Success', `Audio file "${fileName}" imported successfully!`);
    } catch (e) {
      console.error('pickAudioFile', e);
      Alert.alert('Error', 'Unable to pick audio file: ' + e.message);
    }
  };
  /* ------------------ RECORDING WITH LIVE STT ------------------ */
  const startRecording = useCallback(async () => {
    try {
      setRecordingLoading(true);
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permissions', 'Microphone permission is required.');
        setRecordingLoading(false);
        return;
      }

      // Start live STT (Voice)
      try {
        await Voice.start('en-US');
      } catch (e) {
        console.warn('Voice.start failed', e);
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setLiveTranscript('');
    } catch (e) {
      console.error('startRecording', e);
      Alert.alert('Error', 'Could not start recording.');
    } finally {
      setRecordingLoading(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) return;
      setRecordingLoading(true);

      // Stop Voice (STT)
      try {
        await Voice.stop();
      } catch (e) {
        // ignore
      }

      const rec = recordingRef.current;
      await rec.stopAndUnloadAsync();
      let uri = rec.getURI();
      const dest = FileSystem.cacheDirectory + `recording-${Date.now()}.m4a`;
      try {
        await FileSystem.moveAsync({ from: uri, to: dest });
        uri = dest;
      } catch {
        try {
          const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
          await FileSystem.writeAsStringAsync(dest, b64, { encoding: FileSystem.EncodingType.Base64 });
          uri = dest;
        } catch (e2) {
          console.warn('stopRecording: fallback copy failed', e2);
        }
      }

      setAudioUri(uri);
      setAudioName('Recording ' + new Date().toLocaleString());
      setTranscript(liveTranscript || '');
      recordingRef.current = null;
      setIsRecording(false);

      if (isSignedIn && authUser) {
        const s = new Audio.Sound();
        try {
          await s.loadAsync({ uri });
          const status = await s.getStatusAsync();
          const durationSec = status.durationMillis ? Math.round(status.durationMillis / 1000) : null;
          await s.unloadAsync();
          await addToHistory({
            id: 'h' + Date.now(),
            name: 'Recording ' + new Date().toLocaleString(),
            uri,
            ts: Date.now(),
            duration: durationSec,
            transcript: liveTranscript || null,
            summary: null,
          });
        } catch {
          await addToHistory({
            id: 'h' + Date.now(),
            name: 'Recording ' + new Date().toLocaleString(),
            uri,
            ts: Date.now(),
            duration: null,
            transcript: liveTranscript || null,
            summary: null,
          });
        }
      }
    } catch (e) {
      console.error('stopRecording', e);
      Alert.alert('Error', 'Could not stop recording correctly.');
    } finally {
      setRecordingLoading(false);
    }
  }, [addToHistory, authUser, isSignedIn, liveTranscript]);

  /* ------------------ PLAYBACK ------------------ */
  const onPlaybackStatus = useCallback((status) => {
    if (!status) return;
    setIsPlaying(status.isPlaying);
    if (status.didJustFinish) setIsPlaying(false);
  }, []);

  const playAudio = useCallback(async (uriArg = null) => {
    const uriToPlay = uriArg || audioUri;
    if (!uriToPlay) {
      Alert.alert('No audio', 'Please import or record audio first.');
      return;
    }
    try {
      setLoadingSound(true);
      if (soundObj) {
        await soundObj.unloadAsync();
        setSoundObj(null);
        setIsPlaying(false);
      }
      const { sound } = await Audio.Sound.createAsync({ uri: uriToPlay }, { shouldPlay: true }, onPlaybackStatus);
      setSoundObj(sound);
      setIsPlaying(true);
    } catch (e) {
      console.error('playAudio', e);
      Alert.alert('Playback error', 'Could not play audio.');
    } finally {
      setLoadingSound(false);
    }
  }, [audioUri, onPlaybackStatus, soundObj]);

  const pauseAudio = useCallback(async () => {
    if (!soundObj) return;
    try {
      await soundObj.pauseAsync();
      setIsPlaying(false);
    } catch (e) {
      console.warn('pauseAudio', e);
    }
  }, [soundObj]);

  /* ------------------ TRANSCRIPT / SUMMARY ------------------ */
  const autoSummarize = useCallback(() => {
    const text = transcript || liveTranscript;
    if (!text || text.trim().length < 20) {
      Alert.alert('No transcript', 'Please paste or record a transcript first.');
      return;
    }
    const s = simpleExtractiveSummarizer(text, 3);
    setSummary(s);
    // Update history if exists
    if (isSignedIn && authUser && audioUri) {
      (async () => {
        try {
          const key = HISTORY_KEY_PREFIX + authUser;
          const raw = await AsyncStorage.getItem(key);
          const arr = raw ? JSON.parse(raw) : [];
          const idx = arr.findIndex(h => h.uri === audioUri);
          if (idx !== -1) {
            arr[idx].transcript = text;
            arr[idx].summary = s;
            await AsyncStorage.setItem(key, JSON.stringify(arr));
            setHistory(arr);
          }
        } catch (e) { /* ignore */ }
      })();
    }
    Alert.alert('Summary generated');
  }, [transcript, liveTranscript, isSignedIn, authUser, audioUri]);

  /* ------------------ QUIZ ------------------ */
  const openQuiz = useCallback(() => {
    const text = transcript || liveTranscript;
    if (!text || text.trim().length < 20) {
      Alert.alert('No transcript', 'Please provide a transcript first (record or paste it).');
      return;
    }
    const qs = generateFillInTheBlankQuestions(text, 5);
    setQuizQuestions(qs);
    setShowQuizModal(true);
  }, [transcript, liveTranscript]);

  const submitQuizAnswer = (qid, selected) => {
    setQuizQuestions(prev => prev.map(q => q.id === qid ? { ...q, userAnswer: selected } : q));
  };

  /* ------------------ UI HELPERS ------------------ */
  const loadHistoryAudio = useCallback(async (entry) => {
    setAudioUri(entry.uri);
    setAudioName(entry.name);
    setTranscript(entry.transcript || '');
    setSummary(entry.summary || '');
  }, []);

  /* ------------------ RENDER ------------------ */
  return (
    <PaperProvider>
      <LinearGradient 
        colors={darkMode ? ['#071021', '#0b1220'] : ['#E6F0FF', '#F8FAFF']} 
        style={[theme.container]}
      >
        <SafeAreaView style={[theme.container]}>
          {/* Header */}
          <View style={theme.header}>
            <View>
              <Title style={theme.title}>LiteLecture</Title>
              <Paragraph style={theme.subtitle}>Record → Transcribe → Summarize → Quiz (Offline)</Paragraph>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={theme.smallText}>{darkMode ? 'Dark' : 'Light'}</Text>
                <Switch value={darkMode} onValueChange={setDarkMode} />
              </View>

              <Button mode="contained" compact onPress={() => {
                if (isSignedIn) {
                  Alert.alert('Account', `Signed in as ${authUser}`, [
                    { text: 'Sign out', onPress: handleSignOut },
                    { text: 'Close', style: 'cancel' },
                  ]);
                } else {
                  setShowAuthModal(true);
                }
              }}>
                {isSignedIn ? authUser : 'Sign In / Sign Up'}
              </Button>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* Recorder Card */}
            <Card style={theme.card}>
              <Card.Content>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={theme.cardTitle}>Add or Record Audio</Text>
                    <Text style={theme.cardSubtitle}>Record with live STT or import audio files.</Text>
                  </View>
                  <Avatar.Icon size={48} icon="microphone" />
                </View>

                <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Button mode="contained" onPress={pickAudioFile} style={{ backgroundColor: '#3B82F6', flex: 1 }}>
                    Pick Audio
                  </Button>

                  <Button
                    mode={isRecording ? 'contained' : 'outlined'}
                    onPress={isRecording ? stopRecording : startRecording}
                    loading={recordingLoading}
                    style={[{ flex: 1 }, isRecording ? { backgroundColor: '#D32F2F' } : { borderColor: '#10B981' }]}
                  >
                    {isRecording ? 'Stop' : 'Record'}
                  </Button>

                  <Button
                    mode="outlined"
                    onPress={() => {
                      if (audioUri) {
                        if (isPlaying) {
                          pauseAudio();
                        } else {
                          playAudio();
                        }
                      }
                    }}
                    disabled={!audioUri}
                    style={{ borderColor: '#6B7280', flex: 1 }}
                  >
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                </View>

                <View style={{ marginTop: 12 }}>
                  <Text style={theme.smallText}>Selected:</Text>
                  <Text style={theme.largeText}>{audioName || 'No audio selected'}</Text>
                </View>

                {/* Live transcript display */}
                {isRecording && liveTranscript && (
                  <View style={{ marginTop: 12, padding: 12, backgroundColor: darkMode ? '#374151' : '#F3F4F6', borderRadius: 8 }}>
                    <Text style={[theme.smallText, { marginBottom: 4 }]}>Live Transcript:</Text>
                    <Text style={theme.largeText}>{liveTranscript}</Text>
                  </View>
                )}

                <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity style={theme.actionButton} onPress={() => {
                    if (!audioUri) {
                      Alert.alert('No audio', 'Add or record audio first.');
                      return;
                    }
                    setShowTranscriptModal(true);
                  }}>
                    <Text style={theme.actionButtonText}>Transcript / Summarize</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={theme.actionButton} onPress={openQuiz}>
                    <Text style={theme.actionButtonText}>Take Quiz</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>

            {/* History */}
            {isSignedIn && (
              <Card style={theme.card}>
                <Card.Content>
                  <Text style={theme.cardTitle}>History</Text>
                  {history.length === 0 ? (
                    <Text style={theme.cardSubtitle}>No saved audio yet.</Text>
                  ) : (
                    <FlatList
                      data={history}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          style={theme.historyItem}
                          onPress={() => loadHistoryAudio(item)}
                        >
                          <Avatar.Icon 
                            size={36} 
                            icon={item.name.includes('Recording') ? 'microphone' : 'file-audio'} 
                          />
                          <View style={theme.historyText}>
                            <Text style={theme.historyTitle} numberOfLines={1}>{item.name}</Text>
                            <Text style={theme.historySubtitle}>
                              {new Date(item.ts).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                              {item.duration && ` • ${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`}
                            </Text>
                            {item.transcript && (
                              <Text style={[theme.historySubtitle, { fontStyle: 'italic' }]} numberOfLines={1}>
                                "{item.transcript.substring(0, 50)}..."
                              </Text>
                            )}
                          </View>
                          <Button mode="outlined" compact onPress={() => playAudio(item.uri)}>
                            Play
                          </Button>
                        </TouchableOpacity>
                      )}
                      showsVerticalScrollIndicator={false}
                      style={{ maxHeight: 300 }}
                    />
                  )}
                </Card.Content>
              </Card>
            )}
          </ScrollView>

          {/* Auth Modal */}
          <Modal visible={showAuthModal} transparent animationType="fade">
            <View style={theme.modalContainer}>
              <Card style={[theme.modalContent, { width: '85%' }]}>
                <Card.Content>
                  <Title style={theme.modalTitle}>
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </Title>
                  
                  <TextInput
                    style={theme.textInput}
                    placeholder="Username"
                    placeholderTextColor={theme.smallText.color}
                    value={usernameInput}
                    onChangeText={setUsernameInput}
                    autoCapitalize="none"
                  />

                  <TextInput
                    style={theme.textInput}
                    placeholder="Password"
                    placeholderTextColor={theme.smallText.color}
                    value={passwordInput}
                    onChangeText={setPasswordInput}
                    secureTextEntry
                  />

                  <View style={{ marginTop: 20, gap: 12 }}>
                    <Button
                      mode="contained"
                      onPress={authMode === 'login' ? handleLogin : handleSignup}
                      loading={loadingAuth}
                      disabled={!usernameInput.trim() || !passwordInput}
                      style={{ backgroundColor: '#3B82F6' }}
                    >
                      {authMode === 'login' ? 'Sign In' : 'Create Account'}
                    </Button>

                    <Button
                      mode="outlined"
                      onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                      style={{ borderColor: '#6B7280' }}
                    >
                      {authMode === 'login' ? 'Create New Account' : 'Already Have Account?'}
                    </Button>

                    <Button mode="text" onPress={() => setShowAuthModal(false)}>
                      Continue as Guest
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </View>
          </Modal>

          {/* Transcript Modal */}
          <Modal visible={showTranscriptModal} transparent animationType="slide">
            <View style={theme.modalContainer}>
              <Card style={[theme.modalContent, { width: '95%', maxHeight: '90%' }]}>
                <Card.Content>
                  <Title style={theme.modalTitle}>Transcript & Summary</Title>
                  
                  <ScrollView style={{ maxHeight: '70%' }}>
                    <Text style={[theme.cardTitle, { fontSize: 16, marginBottom: 8 }]}>Transcript</Text>
                    <TextInput
                      style={[theme.textArea, { minHeight: 150 }]}
                      placeholder="Paste or type your transcript here..."
                      placeholderTextColor={theme.smallText.color}
                      value={transcript}
                      onChangeText={setTranscript}
                      multiline
                      textAlignVertical="top"
                    />

                    {summary ? (
                      <View style={{ marginTop: 16 }}>
                        <Text style={[theme.cardTitle, { fontSize: 16, marginBottom: 8 }]}>Summary</Text>
                        <View style={[theme.card, { backgroundColor: theme.actionButton.backgroundColor, padding: 12 }]}>
                          <Text style={[theme.largeText, { lineHeight: 22 }]}>{summary}</Text>
                        </View>
                      </View>
                    ) : null}
                  </ScrollView>

                  <View style={{ marginTop: 20, gap: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Button
                        mode="contained"
                        onPress={autoSummarize}
                        disabled={!transcript || transcript.trim().length < 20}
                        style={{ backgroundColor: '#10B981', flex: 1 }}
                      >
                        Summarize
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => { setTranscript(''); setSummary(''); }}
                        style={{ borderColor: '#DC2626', flex: 1 }}
                      >
                        Clear
                      </Button>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Button
                        mode="contained"
                        onPress={async () => {
                          if (isSignedIn && authUser) {
                            const key = HISTORY_KEY_PREFIX + authUser;
                            const raw = await AsyncStorage.getItem(key);
                            const arr = raw ? JSON.parse(raw) : [];
                            const idx = arr.findIndex((h) => h.uri === audioUri);
                            if (idx !== -1) {
                              arr[idx].transcript = transcript;
                              arr[idx].summary = summary;
                              await AsyncStorage.setItem(key, JSON.stringify(arr));
                              setHistory(arr);
                              Alert.alert('Saved', 'Transcript and summary saved to history entry.');
                            } else {
                              Alert.alert('Saved locally', 'Transcript saved locally in this session only.');
                            }
                          } else {
                            Alert.alert('Guest mode', 'You are using guest mode. Sign in to save history.');
                          }
                        }}
                        style={{ backgroundColor: '#3B82F6', flex: 1 }}
                      >
                        Save
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => setShowTranscriptModal(false)}
                        style={{ borderColor: '#6B7280', flex: 1 }}
                      >
                        Close
                      </Button>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </View>
          </Modal>

          {/* Quiz Modal */}
          <Modal visible={showQuizModal} transparent animationType="slide">
            <View style={theme.modalContainer}>
              <Card style={[theme.modalContent, { width: '95%', maxHeight: '90%' }]}>
                <Card.Content>
                  <Title style={theme.modalTitle}>Knowledge Quiz</Title>
                  
                  <View style={{ marginBottom: 16 }}>
                    <Text style={[theme.smallText, { marginBottom: 4 }]}>
                      Progress: {quizQuestions.filter(q => q.userAnswer !== null).length} / {quizQuestions.length}
                    </Text>
                    <ProgressBar 
                      progress={quizQuestions.length > 0 ? quizQuestions.filter(q => q.userAnswer !== null).length / quizQuestions.length : 0} 
                      style={{ height: 6, borderRadius: 3 }}
                      color="#3B82F6"
                    />
                  </View>

                  <ScrollView style={{ maxHeight: '70%' }}>
                    {quizQuestions.map((q) => (
                      <View key={q.id} style={{ marginBottom: 16 }}>
                        <Text style={[theme.cardTitle, { fontSize: 16, marginBottom: 8 }]}>Question {q.id}</Text>
                        <Text style={[theme.largeText, { marginBottom: 12, lineHeight: 22 }]}>{q.question}</Text>
                        
                        {q.options.map((option, optIndex) => (
                          <TouchableOpacity
                            key={optIndex}
                            style={[
                              {
                                borderWidth: 1,
                                borderColor: darkMode ? '#4B5563' : '#D1D5DB',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 8,
                                backgroundColor: q.userAnswer === option 
                                  ? (darkMode ? '#1E3A8A' : '#EBF4FF')
                                  : (darkMode ? '#374151' : '#F9FAFB'),
                              },
                              q.userAnswer === option && { borderColor: '#3B82F6' }
                            ]}
                            onPress={() => submitQuizAnswer(q.id, option)}
                          >
                            <Text style={theme.largeText}>
                              {String.fromCharCode(65 + optIndex)}. {option}
                            </Text>
                          </TouchableOpacity>
                        ))}

                        {q.userAnswer && (
                          <Text style={{
                            color: q.userAnswer === q.answer ? '#10B981' : '#DC2626',
                            fontWeight: '600',
                            marginTop: 8
                          }}>
                            {q.userAnswer === q.answer ? '✓ Correct!' : `✗ Correct answer: ${q.answer}`}
                          </Text>
                        )}
                      </View>
                    ))}
                  </ScrollView>

                  <View style={{ marginTop: 20 }}>
                    {quizQuestions.filter(q => q.userAnswer !== null).length === quizQuestions.length && quizQuestions.length > 0 && (
                      <View style={[theme.card, { backgroundColor: theme.actionButton.backgroundColor, padding: 12, marginBottom: 12 }]}>
                        <Text style={[theme.cardTitle, { textAlign: 'center', fontSize: 18 }]}>
                          Quiz Score: {Math.round((quizQuestions.filter(q => q.userAnswer === q.answer).length / quizQuestions.length) * 100)}%
                        </Text>
                      </View>
                    )}
                    <Button
                      mode="contained"
                      onPress={() => setShowQuizModal(false)}
                      style={{ backgroundColor: '#3B82F6' }}
                    >
                      Close Quiz
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </PaperProvider>
  );
}
