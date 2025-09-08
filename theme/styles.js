import { StyleSheet } from 'react-native';


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


// Shared non-themed styles used by HeaderBar
authButton: { backgroundColor: '#11182710', padding: 8, borderRadius: 8 },
authButtonText: { fontWeight: '700' },
};


export const stylesLight = StyleSheet.create({
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
});