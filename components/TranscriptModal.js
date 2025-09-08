import React from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';


export default function TranscriptModal({
visible,
onClose,
theme,
transcript,
setTranscript,
summary,
onAutoSummarize,
onClear,
onSave,
}) {
return (
<Modal visible={visible} animationType="slide" transparent>
<View style={theme.modalOverlay}>
<View style={theme.modalCard}>
<Text style={theme.modalTitle}>Transcript & Summary</Text>
<Text style={theme.modalHint}>If automatic transcription is unavailable, paste or type the transcript below then press "Auto Summarize".</Text>


<TextInput
multiline
placeholder="Paste or type transcript here..."
placeholderTextColor={'#666'}
style={theme.textArea}
value={transcript}
onChangeText={setTranscript}
/>


<View style={{ flexDirection: 'row', marginTop: 10 }}>
<TouchableOpacity style={theme.modalPrimary} onPress={onAutoSummarize}>
<Text style={theme.modalPrimaryText}>Auto Summarize</Text>
</TouchableOpacity>


<TouchableOpacity style={theme.modalSecondary} onPress={onSave}>
<Text style={theme.modalSecondaryText}>Save</Text>
</TouchableOpacity>
</View>


<Text style={[theme.smallText, { marginTop: 12 }]}>Summary</Text>
<Text style={theme.summaryBox}>{summary || 'No summary yet.'}</Text>


<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
<TouchableOpacity style={theme.modalCloseButton} onPress={onClose}>
<Text style={theme.modalCloseText}>Close</Text>
</TouchableOpacity>


<TouchableOpacity style={theme.modalCloseButton} onPress={onClear}>
<Text style={theme.modalCloseText}>Clear</Text>
</TouchableOpacity>
</View>
</View>
</View>
</Modal>
);
}