import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SafeAreaView, View, Text, Alert, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Components
import HeaderBar from './components/HeaderBar';
import AudioControls from './components/AudioControls';
import TranscriptModal from './components/TranscriptModal';
import QuizModal from './components/QuizModal';
import AuthModal from './components/AuthModal';
import HistoryList from './components/HistoryList';

// Styles
import { stylesLight, stylesDark } from './theme/styles';

// Utils
import { simpleExtractiveSummarizer, generateFillInTheBlankQuestions } from './utils/text';

export default function App() {
  // Theme
  const [darkMode, setDarkMode] = useState(false);

  // Auth
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [authUser, setAuthUser] = useState(null);
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

  // Theme styles
  const theme = darkMode ? stylesDark : stylesLight;

  /* ------------------ bootstrap ------------------ */
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

    return () => {
      if (soundObj) {
        soundObj.unloadAsync?.();
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync?.();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------ AUTH helpers ------------------ */
  const getUsers = useCallback(async () => {
    const raw = await AsyncStorage.getItem('users');
    return raw ? JSON.parse(raw) : {};
  }, []);
  const saveUsers = useCallback(async (users) => {
    await AsyncStorage.setItem('users', JSON.stringify(users));
  }, []);

  const handleSignup = useCallback(async (username, password) => {
    if (!username?.trim() || !password) {
      Alert.alert('Signup', 'Provide username and password.');
      return;
    }
    setLoadingAuth(true);
    try {
      const users = await getUsers();
      if (users[username]) {
        Alert.alert('Signup', 'Username already taken.');
        return;
      }
      users[username] = password; // demo only
      await saveUsers(users);
      setIsSignedIn(true);
      setAuthUser(username);
      await AsyncStorage.setItem('lastUser', username);
      await loadHistoryForUser(username);
      setShowAuthModal(false);
      Alert.alert('Signup', 'Account created and signed in.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not create account.');
    } finally {
      setLoadingAuth(false);
    }
  }, [getUsers, saveUsers]);

  const handleLogin = useCallback(async (username, password) => {
    if (!username?.trim() || !password) {
      Alert.alert('Login', 'Provide username and password.');
      return;
    }
    setLoadingAuth(true);
    try {
      const users = await getUsers();
      if (users[username] && users[username] === password) {
        setIsSignedIn(true);
        setAuthUser(username);
        await AsyncStorage.setItem('lastUser', username);
        await loadHistoryForUser(username);
        setShowAuthModal(false);
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
  }, [getUsers]);

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

  /* ------------------ FILE PICKING (robust) ------------------ */
  const pickAudioFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: false,
      });

      // Support both new and old shapes
      let canceled = false;
      let asset = null;
      if ('canceled' in result) {
        canceled = result.canceled;
        asset = result.assets?.[0] ?? null;
      } else {
        canceled = result.type !== 'success';
        asset = result; // old shape
      }
      if (canceled || !asset?.uri) return;

      const resName = asset.name || 'Imported Audio';
      let finalUri = asset.uri;

      const inCache = finalUri.startsWith(FileSystem.cacheDirectory);
      const hasFilePrefix = finalUri.startsWith('file://');
      const needsCopyToCache = !(inCache || hasFilePrefix);

      if (needsCopyToCache) {
        const safeName = resName.replace(/[^\w.\-]/g, '_') || `imported-${Date.now()}.aac`;
        const dest = FileSystem.cacheDirectory + `${Date.now()}-${safeName}`;
        try {
          const b64 = await FileSystem.readAsStringAsync(finalUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await FileSystem.writeAsStringAsync(dest, b64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          finalUri = dest;
        } catch (errRead) {
          try {
            await FileSystem.downloadAsync(finalUri, dest);
            finalUri = dest;
          } catch (errDl) {
            console.error('pickAudioFile: unable to copy URI', errRead, errDl);
            Alert.alert('Import failed', 'Could not import selected audio file.');
            return;
          }
        }
      } else if (!hasFilePrefix) {
        finalUri = 'file://' + finalUri;
      }

      setAudioUri(finalUri);
      setAudioName(resName);
      setTranscript('');
      setSummary('');

      if (soundObj) {
        await soundObj.unloadAsync();
        setSoundObj(null);
        setIsPlaying(false);
      }

      if (isSignedIn && authUser) {
        const entryBase = {
          id: 'h' + Date.now(),
          name: resName,
          uri: finalUri,
          ts: Date.now(),
          transcript: null,
          summary: null,
        };
        try {
          const s = new Audio.Sound();
          await s.loadAsync({ uri: finalUri });
          const status = await s.getStatusAsync();
          const durationSec = status.durationMillis
            ? Math.round(status.durationMillis / 1000)
            : null;
          await s.unloadAsync();
          await addToHistory({ ...entryBase, duration: durationSec });
        } catch {
          await addToHistory({ ...entryBase, duration: null });
        }
      }
    } catch (err) {
      console.error('pickAudioFile', err);
      Alert.alert('Error', 'Unable to pick audio file.');
    }
  }, [soundObj, isSignedIn, authUser, addToHistory]);

  /* ------------------ RECORDING ------------------ */
  const startRecording = useCallback(async () => {
    try {
      setRecordingLoading(true);
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permissions', 'Microphone permission is required.');
        setRecordingLoading(false);
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
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
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) return;
      setRecordingLoading(true);
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
      setTranscript('');
      setSummary('');
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
            transcript: null,
            summary: null,
          });
        } catch {
          await addToHistory({
            id: 'h' + Date.now(),
            name: 'Recording ' + new Date().toLocaleString(),
            uri,
            ts: Date.now(),
            duration: null,
            transcript: null,
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
  }, [addToHistory, authUser, isSignedIn]);

  /* ------------------ PLAYBACK ------------------ */
  const onPlaybackStatus = useCallback((status) => {
    if (!status) return;
    setIsPlaying((prev) => (prev !== !!status.isPlaying ? !!status.isPlaying : prev));
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

  const stopAndUnload = useCallback(async () => {
    if (!soundObj) return;
    try {
      await soundObj.stopAsync();
      await soundObj.unloadAsync();
      setSoundObj(null);
      setIsPlaying(false);
    } catch (e) {
      console.warn('stopAndUnload', e);
    }
  }, [soundObj]);

  /* ------------------ TRANSCRIPT / SUMMARY ------------------ */
  const openTranscriptEditor = useCallback(() => {
    if (!audioUri) {
      Alert.alert('No audio', 'Add or record audio first.');
      return;
    }
    setShowTranscriptModal(true);
  }, [audioUri]);

  const autoSummarize = useCallback(async () => {
    if (!transcript || transcript.trim().length < 20) {
      Alert.alert('No transcript', 'Please paste or type the transcript first.');
      return;
    }
    const s = simpleExtractiveSummarizer(transcript, 3);
    setSummary(s);

    if (isSignedIn && authUser) {
      const key = HISTORY_KEY_PREFIX + authUser;
      const raw = await AsyncStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      const idx = arr.findIndex((h) => h.uri === audioUri);
      if (idx !== -1) {
        arr[idx].transcript = transcript;
        arr[idx].summary = s;
        await AsyncStorage.setItem(key, JSON.stringify(arr));
        setHistory(arr);
      }
    }
    Alert.alert('Summary generated', 'A short summary was generated from the transcript.');
  }, [transcript, isSignedIn, authUser, audioUri]);

  /* ------------------ QUIZ ------------------ */
  const openQuiz = useCallback(() => {
    if (!transcript || transcript.trim().length < 20) {
      Alert.alert('No transcript', 'Please provide a transcript first (use the Transcript editor).');
      return;
    }
    const qs = generateFillInTheBlankQuestions(transcript, 5);
    setQuizQuestions(qs);
    setShowQuizModal(true);
  }, [transcript]);

  /* ------------------ UI HELPERS ------------------ */
  const loadHistoryAudio = useCallback(async (entry) => {
    setAudioUri(entry.uri);
    setAudioName(entry.name);
    setTranscript(entry.transcript || '');
    setSummary(entry.summary || '');
  }, []);

  return (
    <SafeAreaView style={[theme.container]}>
      <HeaderBar
  theme={theme}
  darkMode={darkMode}
  setDarkMode={setDarkMode}
  isSignedIn={isSignedIn}
  authUser={authUser}
  onSignIn={() => setShowAuthModal(true)}   // open modal in login mode
  onSignUp={() => { setAuthMode('signup'); setShowAuthModal(true); }}
  onSignOut={handleSignOut}
/>


      {/* Main Area */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={theme.card}>
          <Text style={theme.cardTitle}>Add or Record Audio</Text>
          <Text style={theme.cardSubtitle}>
            Import audio files or record directly. Imported files are copied to app cache.
          </Text>

          <AudioControls
            theme={theme}
            pickAudioFile={pickAudioFile}
            isRecording={isRecording}
            startRecording={startRecording}
            stopRecording={stopRecording}
            recordingLoading={recordingLoading}
            audioUri={audioUri}
            isPlaying={isPlaying}
            playAudio={playAudio}
            pauseAudio={pauseAudio}
          />

          <View style={{ marginTop: 12 }}>
            <Text style={theme.smallText}>Selected:</Text>
            <Text style={theme.largeText}>{audioName || 'No audio selected'}</Text>
          </View>

          <View style={{ marginTop: 14, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={theme.actionButton}>
              <Text style={theme.actionButtonText} onPress={openTranscriptEditor}>
                Transcript / Summarize
              </Text>
            </View>
            <View style={theme.actionButton}>
              <Text style={theme.actionButtonText} onPress={openQuiz}>
                Take Quiz
              </Text>
            </View>
          </View>
        </View>

        {isSignedIn && (
          <View style={[theme.card, { marginTop: 16 }]}>
            <Text style={theme.cardTitle}>History</Text>
            {history.length === 0 ? (
              <Text style={theme.cardSubtitle}>No saved audio yet.</Text>
            ) : (
              <HistoryList
                theme={theme}
                history={history}
                onLoad={loadHistoryAudio}
                onPlay={(uri) => playAudio(uri)}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <TranscriptModal
        visible={showTranscriptModal}
        onClose={() => setShowTranscriptModal(false)}
        theme={theme}
        transcript={transcript}
        setTranscript={setTranscript}
        summary={summary}
        onAutoSummarize={autoSummarize}
        onClear={() => {
          setTranscript('');
          setSummary('');
        }}
        onSave={async () => {
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
      />

      <QuizModal
        visible={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        theme={theme}
        quizQuestions={quizQuestions}
        setQuizQuestions={setQuizQuestions}
      />

      <AuthModal
        visible={showAuthModal}
        mode={authMode}
        setMode={setAuthMode}
        loading={loadingAuth}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onClose={() => setShowAuthModal(false)}
        theme={theme}
      />
    </SafeAreaView>
  );
}
