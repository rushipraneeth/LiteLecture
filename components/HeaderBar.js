// components/HeaderBar.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HeaderBar({ 
  theme, 
  darkMode, 
  setDarkMode, 
  isSignedIn, 
  authUser, 
  onSignIn, 
  onSignUp, 
  onSignOut 
}) {
  return (
    <View style={[styles.container, theme.header]}>
      <Text style={styles.title}>LiteLecture</Text>

      <View style={styles.rightButtons}>
        {isSignedIn ? (
          <>
            <Text style={styles.userText}>Hello, {authUser}</Text>
            <TouchableOpacity style={styles.button} onPress={onSignOut}>
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={onSignIn}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={onSignUp}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#222222ff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userText: {
    color: '#fff',
    marginRight: 10,
  },
  button: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
