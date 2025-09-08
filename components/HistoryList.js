import React from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';


export default function HistoryList({ theme, history, onLoad, onPlay }) {
return (
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
<TouchableOpacity style={theme.historyButton} onPress={() => onLoad(item)}>
<Text style={theme.historyButtonText}>Load</Text>
</TouchableOpacity>
<TouchableOpacity style={theme.historyButton} onPress={() => onPlay(item.uri)}>
<Text style={theme.historyButtonText}>Play</Text>
</TouchableOpacity>
</View>
</View>
)}
/>
);
}