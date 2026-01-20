import * as Notifications from 'expo-notifications'
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font'; 
import { NationalPark_400Regular, NationalPark_700Bold } from '@expo-google-fonts/national-park'
import axios from 'axios';

import { setupLocalNotifications } from './utils/notificationUtils';

import LoginScreen from './screens/login';
import HomeScreen from './screens/home';
import Grade from './screens/grade';
import PaymentScreen from './screens/payment';
import ScheduleScreen from './screens/schedule';
import ExamScheduleScreen from './screens/exam';
import SettingsScreen from './screens/setting';

const Stack = createNativeStackNavigator();

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [fontsLoaded,error] = useFonts({
    'NR': NationalPark_400Regular,
    'NB': NationalPark_700Bold, 
  });
  useEffect(() => {
      if (fontsLoaded && !error && !isLoading) {
          console.log('Font Loaded');
      }
      if (error) {
          console.error("FAILED", error);
      }
  }, [fontsLoaded, error, isLoading]);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try{
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } finally {
        
        setIsLoading(false)
      }
    };
    checkLoginStatus();
  }, []);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Đang kiểm tra đăng nhập...</Text>
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={userToken ? 'Home' : 'Login'}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Grade" component={Grade} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="Schedule" component={ScheduleScreen} />
        <Stack.Screen name="Exam" component={ExamScheduleScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    <Text style={styles.copyrightText}>
        © 2025 TLU Connect by Đ.N.Vũ. All rights reserved.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  copyrightText: {
    fontSize: 7,
    color: '#888', // Màu xám nhạt
    textAlign: 'center',
    paddingBottom: 5, // Khoảng cách với đáy màn hình
    position: 'absolute', // Đặt vị trí tuyệt đối
    bottom: 0, // Căn dưới cùng
    left: 0,
    right: 0,
    backgroundColor: 'transparent', // Nền trong suốt
  },
});

export default App;
