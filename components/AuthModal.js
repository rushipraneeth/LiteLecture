import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';


export default function AuthModal({ visible, mode, setMode, loading, onLogin, onSignup, onClose, theme }) {
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');


return (
<Modal visible={visible} animationType="slide" transparent>
<View style={theme.modalOverlay}>
<View style={theme.modalCard}>
<Text style={theme.modalTitle}>{mode === 'login' ? 'Sign In' : 'Sign Up'}</Text>


<TextInput
placeholder="Username"
placeholderTextColor={'#666'}
style={theme.input}
autoCapitalize="none"
value={username}
onChangeText={setUsername}
/>
<TextInput
placeholder="Password"
placeholderTextColor={'#666'}
style={theme.input}
secureTextEntry
value={password}
onChangeText={setPassword}
/>


<View style={{ flexDirection: 'row', marginTop: 10 }}>
<TouchableOpacity
style={[theme.modalPrimary, { flex: 1, marginRight: 6 }]}
onPress={() => (mode === 'login' ? onLogin(username, password) : onSignup(username, password))}
disabled={loading}
>
{loading ? <ActivityIndicator color="#fff" /> : (
<Text style={theme.modalPrimaryText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
)}
</TouchableOpacity>


<TouchableOpacity
style={[theme.modalSecondary, { flex: 1, marginLeft: 6 }]}
onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
>
<Text style={theme.modalSecondaryText}>{mode === 'login' ? 'Switch to Sign Up' : 'Switch to Sign In'}</Text>
</TouchableOpacity>
</View>


<TouchableOpacity style={[theme.modalCloseButton, { marginTop: 12 }]} onPress={onClose}>
<Text style={theme.modalCloseText}>Continue as Guest (no history saved)</Text>
</TouchableOpacity>
</View>
</View>
</Modal>
);
}