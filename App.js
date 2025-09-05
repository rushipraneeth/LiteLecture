import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

/*
  Required packages (run in project folder):
    expo install expo-av expo-document-picker expo-file-system
    npm install @react-native-async-storage/async-storage

  Notes:
  - This implements a robust file import (handles content:// URIs by reading base64 and writing into cache).
  - Recording saves the audio file into the app cache and, if signed in, to the user's history.
  - Simple local sign-up/sign-in using AsyncStorage (demo ONLY; not secure).
  - Summarize: basic extractive summarizer built from the transcript text (user can edit transcript if automatic transcription not available).
  - Quiz: simple fill-in-the-blank MCQ generator based on the transcript.
  - All transcription is manual/assisted—true STT (speech-to-text) offline requires additional native/ML integration.
*/

export default function App() {
  // Theme
  const [darkMode, setDarkMode] = useState(false);

  // Auth
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
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

  // Transcript / Summary / Quiz
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);

  // History
  const [history, setHistory] = useState([]);
  const HISTORY_KEY_PREFIX = 'history:'; // + username

  // Utility: theme
  const theme = darkMode ? stylesDark : stylesLight;

  useEffect(() => {
    // On first load, keep auth modal open; try to load last signed-in user (optional)
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
    // cleanup audio on unmount
    return () => {
      if (soundObj) {
        soundObj.unloadAsync?.();
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync?.();
      }
    };
  }, []);

  /* ------------------ AUTH (simple local) ------------------ */
  // users stored as map under key 'users' => { username: password }
  const getUsers = async () => {
    const raw = await AsyncStorage.getItem('users');
    return raw ? JSON.parse(raw) : {};
  };

  const saveUsers = async (users) => {
    await AsyncStorage.setItem('users', JSON.stringify(users));
  };

  const handleSignup = async () => {
    if (!usernameInput.trim() || !passwordInput) {
      Alert.alert('Signup', 'Provide username and password.');
      return;
    }
    setLoadingAuth(true);
    try {
      const users = await getUsers();
      if (users[usernameInput]) {
        Alert.alert('Signup', 'Username already taken.');
        setLoadingAuth(false);
        return;
      }
      users[usernameInput] = passwordInput; // For demo only — DO NOT store plain passwords in real apps.
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
  };

  const handleLogin = async () => {
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
  };

  const handleSignOut = async () => {
    setIsSignedIn(false);
    setAuthUser(null);
    setHistory([]);
    await AsyncStorage.removeItem('lastUser');
    setShowAuthModal(true);
  };

  /* ------------------ HISTORY ------------------ */
  const loadHistoryForUser = async (username) => {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY_PREFIX + username);
      const arr = raw ? JSON.parse(raw) : [];
      setHistory(arr);
    } catch (e) {
      console.warn('loadHistoryForUser', e);
      setHistory([]);
    }
  };

  const addToHistory = async (entry) => {
    if (!isSignedIn || !authUser) return;
    const key = HISTORY_KEY_PREFIX + authUser;
    const raw = await AsyncStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(entry); // newest first
    await AsyncStorage.setItem(key, JSON.stringify(arr));
    setHistory(arr);
  };

  /* ------------------ FILE PICKING (robust) ------------------ */
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

  /* ------------------ RECORDING ------------------ */
  const startRecording = async () => {
    try {
      setRecordingLoading(true);
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permissions', 'Microphone permission is required.');
        setRecordingLoading(false);
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (e) {
      console.error('startRecording', e);
      Alert.alert('Error', 'Could not start recording.');
    } finally {
      setRecordingLoading(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recordingRef.current) return;
      setRecordingLoading(true);
      const rec = recordingRef.current;
      await rec.stopAndUnloadAsync();
      let uri = rec.getURI();
      // Move to cache with stable filename
      const dest = FileSystem.cacheDirectory + `recording-${Date.now()}.m4a`;
      try {
        await FileSystem.moveAsync({ from: uri, to: dest });
        uri = dest;
      } catch (e) {
        // move may fail on some platforms; try copy via read/write base64
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
      setTranscript('');
      setSummary('');
      recordingRef.current = null;
      setIsRecording(false);

      // Save to history if signed in
      if (isSignedIn && authUser) {
        const s = new Audio.Sound();
        try {
          await s.loadAsync({ uri });
          const status = await s.getStatusAsync();
          const durationSec = status.durationMillis ? Math.round(status.durationMillis / 1000) : null;
          await s.unloadAsync();
          const entry = {
            id: 'h' + Date.now(),
            name: 'Recording ' + new Date().toLocaleString(),
            uri,
            ts: Date.now(),
            duration: durationSec,
            transcript: null,
            summary: null,
          };
          await addToHistory(entry);
        } catch (e) {
          const entry = {
            id: 'h' + Date.now(),
            name: 'Recording ' + new Date().toLocaleString(),
            uri,
            ts: Date.now(),
            duration: null,
            transcript: null,
            summary: null,
          };
          await addToHistory(entry);
        }
      }
    } catch (e) {
      console.error('stopRecording', e);
      Alert.alert('Error', 'Could not stop recording correctly.');
    } finally {
      setRecordingLoading(false);
    }
  };

  /* ------------------ PLAYBACK ------------------ */
  const playAudio = async (uriArg = null) => {
    const uriToPlay = uriArg || audioUri;
    if (!uriToPlay) {
      Alert.alert('No audio', 'Please import or record audio first.');
      return;
    }
    try {
      setLoadingSound(true);
      // unload any existing sound
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
  };

  const onPlaybackStatus = (status) => {
    if (!status) return;
    setIsPlaying(status.isPlaying);
    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  };

  const pauseAudio = async () => {
    if (!soundObj) return;
    try {
      await soundObj.pauseAsync();
      setIsPlaying(false);
    } catch (e) {
      console.warn('pauseAudio', e);
    }
  };

  const stopAndUnload = async () => {
    if (!soundObj) return;
    try {
      await soundObj.stopAsync();
      await soundObj.unloadAsync();
      setSoundObj(null);
      setIsPlaying(false);
    } catch (e) {
      console.warn('stopAndUnload', e);
    }
  };

  /* ------------------ TRANSCRIPT / SUMMARY ------------------ */
  // Since offline STT isn't available here, allow user to type/edit transcript.
  // Provide an "Auto Summarize" function that picks important sentences.

  const openTranscriptEditor = () => {
    if (!audioUri) {
      Alert.alert('No audio', 'Add or record audio first.');
      return;
    }
    setShowTranscriptModal(true);
  };

  const autoSummarize = () => {
    if (!transcript || transcript.trim().length < 20) {
      Alert.alert('No transcript', 'Please paste or type the transcript first.');
      return;
    }
    // Simple extractive summarizer:
    const s = simpleExtractiveSummarizer(transcript, 3);
    setSummary(s);
    // Save to history record if matching entry exists (for signed-in)
    if (isSignedIn && authUser) {
      // update latest history entry with this audioUri
      (async () => {
        const key = HISTORY_KEY_PREFIX + authUser;
        const raw = await AsyncStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        // find first entry matching uri
        const idx = arr.findIndex((h) => h.uri === audioUri);
        if (idx !== -1) {
          arr[idx].transcript = transcript;
          arr[idx].summary = s;
          await AsyncStorage.setItem(key, JSON.stringify(arr));
          setHistory(arr);
        }
      })();
    }
    Alert.alert('Summary generated', 'A short summary was generated from the transcript.');
  };

  // very simple summarizer: score sentences by word frequency
  const simpleExtractiveSummarizer = (text, sentenceCount = 3) => {
    const stopwords = new Set([
      'the','is','in','and','to','of','a','that','it','on','for','with','as','this','was','are','be','by','an','or','from','at','we','you','i'
    ]);
    const sentences = text
      .replace(/\n/g, ' ')
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length <= sentenceCount) return sentences.join(' ');

    // compute word frequency
    const freq = {};
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w) => {
        if (stopwords.has(w)) return;
        freq[w] = (freq[w] || 0) + 1;
      });

    const sentenceScores = sentences.map((s) => {
      const words = s.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
      let score = 0;
      words.forEach((w) => {
        if (freq[w]) score += freq[w];
      });
      return { s, score };
    });

    sentenceScores.sort((a, b) => b.score - a.score);
    const top = sentenceScores.slice(0, sentenceCount).map((x) => x.s);
    return top.join(' ');
  };

  /* ------------------ QUIZ GENERATION ------------------ */
  const openQuiz = () => {
    if (!transcript || transcript.trim().length < 20) {
      Alert.alert('No transcript', 'Please provide a transcript first (use the Transcript editor).');
      return;
    }
    const qs = generateFillInTheBlankQuestions(transcript, 5);
    setQuizQuestions(qs);
    setShowQuizModal(true);
  };

  // naive MCQ generator: pick sentences, choose a word to hide, generate distractors
  const generateFillInTheBlankQuestions = (text, count = 5) => {
    const sentences = text
      .replace(/\n/g, ' ')
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);
    if (sentences.length === 0) return [];

    const wordsAll = text
      .replace(/[^a-zA-Z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .map((w) => w.trim());

    const uniqueWords = Array.from(new Set(wordsAll)).slice(0, 200);

    const qs = [];
    for (let i = 0; i < Math.min(count, sentences.length); i++) {
      const sent = sentences[i % sentences.length];
      const words = sent.replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/).filter((w) => w.length > 3);
      if (!words.length) continue;
      // choose a random word from sentence
      const candidate = words[Math.floor(Math.random() * words.length)];
      const correct = candidate;
      // create options: correct + 3 random distractors
      const distractors = [];
      const pool = uniqueWords.filter((w) => w.toLowerCase() !== correct.toLowerCase());
      for (let k = 0; k < 3 && pool.length; k++) {
        const idx = Math.floor(Math.random() * pool.length);
        distractors.push(pool.splice(idx, 1)[0]);
      }
      const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
      const questionText = sent.replace(new RegExp(`\\b${escapeRegExp(correct)}\\b`), '____');
      qs.push({ id: i + 1, question: questionText, answer: correct, options, userAnswer: null, correctWord: correct });
    }
    return qs;
  };

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const submitQuizAnswer = (qid, selected) => {
    setQuizQuestions((prev) => prev.map((q) => (q.id === qid ? { ...q, userAnswer: selected } : q)));
  };

  /* ------------------ UI HELPERS ------------------ */
  const loadHistoryAudio = async (entry) => {
    // set audio and transcript/summary from history
    setAudioUri(entry.uri);
    setAudioName(entry.name);
    setTranscript(entry.transcript || '');
    setSummary(entry.summary || '');
  };

  /* ------------------ RENDER ------------------ */
  return (
    <SafeAreaView style={[theme.container]}>
      {/* Header */}
      <View style={theme.header}>
        <View>
          <Text style={theme.title}>LiteLecture</Text>
          <Text style={theme.subtitle}>Audio → Text • Summarize • Quiz</Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Text style={theme.smallText}>{darkMode ? 'Dark' : 'Light'}</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} />
          </View>

          <TouchableOpacity
            style={theme.authButton}
            onPress={() => {
              if (isSignedIn) {
                Alert.alert('Account', `Signed in as ${authUser}`, [
                  { text: 'Sign out', onPress: handleSignOut },
                  { text: 'Close', style: 'cancel' },
                ]);
              } else {
                setShowAuthModal(true);
              }
            }}
          >
            <Text style={theme.authButtonText}>{isSignedIn ? authUser : 'Sign In / Sign Up'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Area */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={theme.card}>
          <Text style={theme.cardTitle}>Add or Record Audio</Text>
          <Text style={theme.cardSubtitle}>Import audio files or record directly. Imported files are copied to app cache.</Text>

          <View style={theme.controlsRow}>
            <TouchableOpacity style={theme.buttonPrimary} onPress={pickAudioFile}>
              <Text style={theme.buttonPrimaryText}>Pick Audio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[theme.buttonAccent, isRecording && theme.buttonAccentActive]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={recordingLoading}
            >
              {recordingLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={theme.buttonAccentText}>{isRecording ? 'Stop' : 'Record'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={theme.buttonSecondary}
              onPress={() => {
                if (audioUri) {
                  if (isPlaying) pauseAudio();
                  else playAudio();
                } else {
                  Alert.alert('No audio', 'Import or record audio first.');
                }
              }}
            >
              <Text style={theme.buttonSecondaryText}>{isPlaying ? 'Pause' : 'Play'}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={theme.smallText}>Selected:</Text>
            <Text style={theme.largeText}>{audioName || 'No audio selected'}</Text>
          </View>

          <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={theme.actionButton} onPress={openTranscriptEditor}>
              <Text style={theme.actionButtonText}>Transcript / Summarize</Text>
            </TouchableOpacity>

            <TouchableOpacity style={theme.actionButton} onPress={openQuiz}>
              <Text style={theme.actionButtonText}>Take Quiz</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* History (for signed in users) */}
        {isSignedIn && (
          <View style={[theme.card, { marginTop: 16 }]}>
            <Text style={theme.cardTitle}>History</Text>
            {history.length === 0 ? (
              <Text style={theme.cardSubtitle}>No saved audio yet.</Text>
            ) : (
              <FlatList
                data={history}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                  <View style={theme.historyItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={theme.historyTitle}>{item.name}</Text>
                      <Text style={theme.historySubtitle}>
                        {item.duration ? `${item.duration}s • ` : ''}{new Date(item.ts).toLocaleString()}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={theme.historyButton}
                        onPress={() => loadHistoryAudio(item)}
                      >
                        <Text style={theme.historyButtonText}>Load</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={theme.historyButton}
                        onPress={() => playAudio(item.uri)}
                      >
                        <Text style={theme.historyButtonText}>Play</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Transcript Modal */}
      <Modal visible={showTranscriptModal} animationType="slide" transparent>
        <View style={theme.modalOverlay}>
          <View style={theme.modalCard}>
            <Text style={theme.modalTitle}>Transcript & Summary</Text>
            <Text style={theme.modalHint}>If automatic transcription is unavailable, paste or type the transcript below then press "Auto Summarize".</Text>

            <TextInput
              multiline
              placeholder="Paste or type transcript here..."
              placeholderTextColor={darkMode ? '#aaa' : '#666'}
              style={theme.textArea}
              value={transcript}
              onChangeText={setTranscript}
            />

            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity style={theme.modalPrimary} onPress={autoSummarize}>
                <Text style={theme.modalPrimaryText}>Auto Summarize</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={theme.modalSecondary}
                onPress={() => {
                  // Save transcript & summary into history entry if signed in
                  if (isSignedIn && authUser) {
                    (async () => {
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
                    })();
                  } else {
                    Alert.alert('Guest mode', 'You are using guest mode. Sign in to save history.');
                  }
                }}
              >
                <Text style={theme.modalSecondaryText}>Save</Text>
              </TouchableOpacity>
            </View>

            <Text style={[theme.smallText, { marginTop: 12 }]}>Summary</Text>
            <Text style={theme.summaryBox}>{summary || 'No summary yet.'}</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity
                style={theme.modalCloseButton}
                onPress={() => {
                  setShowTranscriptModal(false);
                }}
              >
                <Text style={theme.modalCloseText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={theme.modalCloseButton}
                onPress={() => {
                  // Clear summary & transcript
                  setTranscript('');
                  setSummary('');
                }}
              >
                <Text style={theme.modalCloseText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Quiz Modal */}
      <Modal visible={showQuizModal} animationType="slide" transparent>
        <View style={theme.modalOverlay}>
          <View style={[theme.modalCard, { maxHeight: '85%' }]}>
            <Text style={theme.modalTitle}>Quiz</Text>
            <ScrollView style={{ marginTop: 8 }}>
              {quizQuestions.map((q) => (
                <View key={q.id} style={{ marginBottom: 14 }}>
                  <Text style={theme.quizQuestion}>{q.id}. {q.question}</Text>
                  {q.options.map((opt, idx) => {
                    const selected = q.userAnswer === opt;
                    const isCorrect = q.answer.toLowerCase() === opt.toLowerCase();
                    const showResult = q.userAnswer !== null;
                    const optionStyle = [
                      theme.quizOption,
                      selected && { borderColor: '#2563EB', backgroundColor: '#DBEAFE' },
                    ];
                    return (
                      <Pressable
                        key={idx}
                        style={optionStyle}
                        onPress={() => submitQuizAnswer(q.id, opt)}
                      >
                        <Text style={theme.quizOptionText}>{opt}</Text>
                        {showResult && isCorrect && q.userAnswer === opt && <Text style={{ color: 'green' }}> ✓</Text>}
                        {showResult && isCorrect && q.userAnswer !== opt && <Text style={{ color: 'green' }}> ✓</Text>}
                        {showResult && !isCorrect && q.userAnswer === opt && <Text style={{ color: 'red' }}> ✗</Text>}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <TouchableOpacity
                style={theme.modalCloseButton}
                onPress={() => setShowQuizModal(false)}
              >
                <Text style={theme.modalCloseText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={theme.modalPrimary}
                onPress={() => {
                  // show score
                  const total = quizQuestions.length || 1;
                  const correct = quizQuestions.filter((q) => q.userAnswer && q.userAnswer.toLowerCase() === q.answer.toLowerCase()).length;
                  Alert.alert('Quiz complete', `Score: ${correct} / ${total}`);
                }}
              >
                <Text style={theme.modalPrimaryText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* AUTH Modal */}
      <Modal visible={showAuthModal} animationType="slide" transparent>
        <View style={theme.modalOverlay}>
          <View style={theme.modalCard}>
            <Text style={theme.modalTitle}>{authMode === 'login' ? 'Sign In' : 'Sign Up'}</Text>

            <TextInput
              placeholder="Username"
              placeholderTextColor={darkMode ? '#aaa' : '#666'}
              style={theme.input}
              autoCapitalize="none"
              value={usernameInput}
              onChangeText={setUsernameInput}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor={darkMode ? '#aaa' : '#666'}
              style={theme.input}
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
            />

            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity
                style={[theme.modalPrimary, { flex: 1, marginRight: 6 }]}
                onPress={authMode === 'login' ? handleLogin : handleSignup}
                disabled={loadingAuth}
              >
                {loadingAuth ? <ActivityIndicator color="#fff" /> : <Text style={theme.modalPrimaryText}>{authMode === 'login' ? 'Sign In' : 'Create Account'}</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                style={[theme.modalSecondary, { flex: 1, marginLeft: 6 }]}
                onPress={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                }}
              >
                <Text style={theme.modalSecondaryText}>{authMode === 'login' ? 'Switch to Sign Up' : 'Switch to Sign In'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[theme.modalCloseButton, { marginTop: 12 }]}
              onPress={() => {
                setShowAuthModal(false);
              }}
            >
              <Text style={theme.modalCloseText}>Continue as Guest (no history saved)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ------------------ Styles ------------------ */
const base = {
  container: { flex: 1 },
  header: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2 },
  smallText: { fontSize: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 3,
  },
};

const stylesLight = StyleSheet.create({
  container: { ...base.container, backgroundColor: '#F3F6FB' },
  header: { ...base.header },
  title: { ...base.title, color: '#0F172A' },
  subtitle: { ...base.subtitle, color: '#6B7280' },
  smallText: { ...base.smallText, color: '#6B7280' },

  card: { ...base.card, backgroundColor: '#FFFFFF' },
  cardTitle: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
  cardSubtitle: { color: '#6B7280', fontSize: 13, marginTop: 6 },

  controlsRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  buttonPrimary: { backgroundColor: '#3B82F6', padding: 10, borderRadius: 10, minWidth: 100, alignItems: 'center' },
  buttonPrimaryText: { color: '#fff', fontWeight: '700' },
  buttonAccent: { backgroundColor: '#E11D48', padding: 10, borderRadius: 10, minWidth: 90, alignItems: 'center' },
  buttonAccentActive: { opacity: 0.9, shadowColor: '#E11D48', elevation: 3 },
  buttonAccentText: { color: '#fff', fontWeight: '700' },
  buttonSecondary: { backgroundColor: '#11182710', padding: 10, borderRadius: 10, minWidth: 70, alignItems: 'center' },
  buttonSecondaryText: { color: '#0F172A', fontWeight: '700' },

  largeText: { color: '#0F172A', fontSize: 14, marginTop: 4 },
  actionButton: { backgroundColor: '#11182706', padding: 10, borderRadius: 10, minWidth: 140, alignItems: 'center' },
  actionButtonText: { color: '#0F172A', fontWeight: '700' },

  // Missing auth button styles
  authButton: { backgroundColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  authButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: '#00000060', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 640, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  modalHint: { fontSize: 13, color: '#6B7280', marginTop: 6 },

  input: { borderWidth: 1, borderColor: '#E5E7EB', padding: 10, borderRadius: 8, marginTop: 10, color: '#0F172A' },

  textArea: { height: 120, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, marginTop: 8, color: '#0F172A' },

  modalPrimary: { backgroundColor: '#3B82F6', padding: 12, borderRadius: 8, alignItems: 'center' },
  modalPrimaryText: { color: '#fff', fontWeight: '700' },

  modalSecondary: { backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, alignItems: 'center', marginLeft: 8 },
  modalSecondaryText: { color: '#0F172A', fontWeight: '700' },

  modalCloseButton: { padding: 8, alignItems: 'center' },
  modalCloseText: { color: '#6B7280' },

  summaryBox: { minHeight: 60, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, marginTop: 6, color: '#0F172A' },

  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  historyTitle: { color: '#0F172A', fontSize: 14, fontWeight: '700' },
  historySubtitle: { color: '#6B7280', fontSize: 12 },
  historyButton: { backgroundColor: '#11182706', padding: 8, borderRadius: 8, marginLeft: 6 },
  historyButtonText: { color: '#0F172A' },

  quizQuestion: { color: '#0F172A', fontWeight: '700', marginBottom: 6 },
  quizOption: { borderWidth: 1, borderColor: '#E5E7EB', padding: 10, borderRadius: 8, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  quizOptionText: { color: '#0F172A' },
});

const stylesDark = StyleSheet.create({
  container: { ...base.container, backgroundColor: '#071021' },
  header: { ...base.header },
  title: { ...base.title, color: '#E6EEF8' },
  subtitle: { ...base.subtitle, color: '#94A3B8' },
  smallText: { ...base.smallText, color: '#94A3B8' },

  card: { ...base.card, backgroundColor: '#0F172A' },
  cardTitle: { color: '#E6EEF8', fontSize: 16, fontWeight: '700' },
  cardSubtitle: { color: '#94A3B8', fontSize: 13, marginTop: 6 },

  controlsRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  buttonPrimary: { backgroundColor: '#2563EB', padding: 10, borderRadius: 10, minWidth: 100, alignItems: 'center' },
  buttonPrimaryText: { color: '#fff', fontWeight: '700' },
  buttonAccent: { backgroundColor: '#FB7185', padding: 10, borderRadius: 10, minWidth: 90, alignItems: 'center' },
  buttonAccentActive: { opacity: 0.9, shadowColor: '#FB7185', elevation: 3 },
  buttonAccentText: { color: '#fff', fontWeight: '700' },
  buttonSecondary: { backgroundColor: '#11182710', padding: 10, borderRadius: 10, minWidth: 70, alignItems: 'center' },
  buttonSecondaryText: { color: '#E6EEF8', fontWeight: '700' },

  largeText: { color: '#E6EEF8', fontSize: 14, marginTop: 4 },
  actionButton: { backgroundColor: '#07102110', padding: 10, borderRadius: 10, minWidth: 140, alignItems: 'center' },
  actionButtonText: { color: '#E6EEF8', fontWeight: '700' },

  // Missing auth button styles
  authButton: { backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  authButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: '#00000060', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 640, backgroundColor: '#0F172A', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#E6EEF8' },
  modalHint: { fontSize: 13, color: '#94A3B8', marginTop: 6 },

  input: { borderWidth: 1, borderColor: '#0B1220', padding: 10, borderRadius: 8, marginTop: 10, color: '#E6EEF8', backgroundColor: '#071021' },

  textArea: { height: 120, borderWidth: 1, borderColor: '#0B1220', borderRadius: 8, padding: 8, marginTop: 8, color: '#E6EEF8', backgroundColor: '#071021' },

  modalPrimary: { backgroundColor: '#2563EB', padding: 12, borderRadius: 8, alignItems: 'center' },
  modalPrimaryText: { color: '#fff', fontWeight: '700' },

  modalSecondary: { backgroundColor: '#07102110', padding: 12, borderRadius: 8, alignItems: 'center', marginLeft: 8 },
  modalSecondaryText: { color: '#E6EEF8', fontWeight: '700' },

  modalCloseButton: { padding: 8, alignItems: 'center' },
  modalCloseText: { color: '#94A3B8' },

  summaryBox: { minHeight: 60, borderWidth: 1, borderColor: '#0B1220', borderRadius: 8, padding: 8, marginTop: 6, color: '#E6EEF8' },

  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#071021' },
  historyTitle: { color: '#E6EEF8', fontSize: 14, fontWeight: '700' },
  historySubtitle: { color: '#94A3B8', fontSize: 12 },
  historyButton: { backgroundColor: '#07102110', padding: 8, borderRadius: 8, marginLeft: 6 },
  historyButtonText: { color: '#E6EEF8' },

  quizQuestion: { color: '#E6EEF8', fontWeight: '700', marginBottom: 6 },
  quizOption: { borderWidth: 1, borderColor: '#0B1220', padding: 10, borderRadius: 8, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#071021' },
  quizOptionText: { color: '#E6EEF8' },
});