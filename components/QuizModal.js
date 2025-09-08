import React from 'react';
import { Modal, View, Text, ScrollView, Pressable, TouchableOpacity, Alert } from 'react-native';


export default function QuizModal({ visible, onClose, theme, quizQuestions, setQuizQuestions }) {
const submitQuizAnswer = (qid, selected) => {
setQuizQuestions((prev) => prev.map((q) => (q.id === qid ? { ...q, userAnswer: selected } : q)));
};


return (
<Modal visible={visible} animationType="slide" transparent>
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
const showResult = q.userAnswer !== null && q.userAnswer !== undefined;
const optionStyle = [theme.quizOption, selected && { borderColor: '#2563EB', backgroundColor: '#DBEAFE' }];
return (
<Pressable key={idx} style={optionStyle} onPress={() => submitQuizAnswer(q.id, opt)}>
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
<TouchableOpacity style={theme.modalCloseButton} onPress={onClose}>
<Text style={theme.modalCloseText}>Close</Text>
</TouchableOpacity>


<TouchableOpacity
style={theme.modalPrimary}
onPress={() => {
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
);
}