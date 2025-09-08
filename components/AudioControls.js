import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';


export default function AudioControls({
theme,
pickAudioFile,
isRecording,
startRecording,
stopRecording,
recordingLoading,
audioUri,
isPlaying,
playAudio,
pauseAudio,
}) {
return (
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
if (isPlaying) pauseAudio(); else playAudio();
} else {
Alert.alert('No audio', 'Import or record audio first.');
}
}}
>
<Text style={theme.buttonSecondaryText}>{isPlaying ? 'Pause' : 'Play'}</Text>
</TouchableOpacity>
</View>
);
}