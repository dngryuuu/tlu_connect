import { processFullSchedule, findUpcomingSession } from '../utils/scheduleProcessor';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
  Text,
  StatusBar,
  Image,
  ImageBackground,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons'; 
function LoginScreen({ navigation }) {  
  const [theme,setTheme] = useState('white')
  const [backgroundImageUri, setBackgroundImageUri] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isBackgroundLoaded, setIsBackgroundLoaded] = useState(false);

  const loadBackground = async () => {
    await AsyncStorage.getItem('app_theme').then(currentTheme => {
      if(currentTheme){
        setTheme(currentTheme)
      }
    })
    const backgroundImage = await AsyncStorage.getItem('backgroundImage')
    setBackgroundImageUri(backgroundImage)
  }
  loadBackground()
    const handleLogin = async () => {
    setError('');
    setOutput('')
    setLoading(true);
    if (!studentId || !password) {
      setError('Vui lòng nhập Mã sinh viên và Mật khẩu.');
      setLoading(false);
      return;
    }

    try {
      const loginPayload = {
        client_id: 'education_client',
        grant_type: 'password',
        username: studentId,
        password: password,
        client_secret: 'password',
      };
      setOutput('Lấy token đăng nhập...')
      const response = await axios.post(
        'https://scheduleapi-khaki.vercel.app/api/loginToken',
        loginPayload
      );
      console.log(response.data.status)
      if (response.data.status == 400) {
        setOutput('')        
        setError('Sai tài khoản hoặc mật khẩu');
        setLoading(false)
      }

      const mainAppHeaders = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8,fr;q=0.7,fr-FR;q=0.6',
        'Connection': 'keep-alive',
        'Authorization': `Bearer ${response.data.access_token}`,
        'withCredentials': true,
      };
      if(response.data == 400){setOutput('')}
      const resp = await axios.post(
        'https://scheduleapi-khaki.vercel.app/api/schedule',
        mainAppHeaders
      );
      setOutput('Tải giao diện người dùng...')
      const res = await axios.post(
        'https://scheduleapi-khaki.vercel.app/api/info',
        mainAppHeaders
      );
      if (response.data && response.data.access_token && res.data.displayName) {
        setOutput('Hoàn Thành')        
        const userName = res.data.displayName;
        const schedule = processFullSchedule(resp.data);
        console.log('hello ',schedule)  
        const upcomingsubject = findUpcomingSession(schedule);
        await AsyncStorage.setItem('tokenExpiresIn', response.data.expires_in.toString()); 
        await AsyncStorage.setItem('loginTimestamp', Date.now().toString());
        await AsyncStorage.setItem('savedStudentId', studentId); 
        await AsyncStorage.setItem('savedPassword', password)
        await AsyncStorage.setItem('schedule', JSON.stringify(schedule));
        await AsyncStorage.setItem('username', userName);
        await AsyncStorage.setItem('userToken', response.data.access_token);
        navigation.replace('Home', {
          user: userName,
          upcomingsub: upcomingsubject,
          scheduleData: schedule,
        });
      } else {
        setError('Đăng nhập thất bại. Phản hồi không hợp lệ.');
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={backgroundImageUri ? {uri : backgroundImageUri} : require('../assets/loginBackground.jpg')}
      resizeMode="cover"
      style={styles.backgroundImage}
      onLoadEnd={() => setIsBackgroundLoaded(true)}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="black" />
        {isBackgroundLoaded ? (
          <View style={styles.content}>
            <Image style={styles.logo} source={require('../assets/login_logo.png')} />
            <Text style={styles.title}>TLU Connect</Text>
            {output ? <Text style={styles.outputText}>{output}</Text> : null}
            <TextInput
              style={[styles.input,{backgroundColor: theme == 'dark' ? 'black' : 'white',fontSize: 14,opacity: 0.8,color: theme == 'dark' ? 'white' : 'black'}]}
              placeholder="Nhập mã sinh viên"
              placeholderTextColor= {theme == 'dark' ? 'white' : '#aaaaaa'}
              onChangeText={text => setStudentId(text)}
              value={studentId}
              underlineColorAndroid="transparent"
              autoCapitalize="none"
              keyboardType="number-pad"
            />
            <View style={[styles.inputs,{backgroundColor: theme == 'dark' ? 'black' : 'white'}]}>
              <TextInput
                style={{ fontSize: 14, flex: 1,opacity: 1,color: theme == 'dark' ? 'white' : 'black' }}
                placeholder="Nhập mật khẩu"
                placeholderTextColor={theme == 'dark' ? 'white' : '#aaaaaa'}
                onChangeText={text => setPassword(text)}
                value={password}
                onSubmitEditing={handleLogin}
                underlineColorAndroid="transparent"
                autoCapitalize="none"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.toggleBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="gray"
                />
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <TouchableOpacity
                style={[styles.loginButton,{backgroundColor: theme == 'dark' ? 'black' : 'white'}]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{flex:1,justifyContent: 'center',alignItems: 'center'}}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
      </SafeAreaView>
      </TouchableWithoutFeedback>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  logo: {
    width: 270,
    height: 45,
    marginBottom: 40,
    marginTop:-200,
    resizeMode: 'stretch',
  },
  title: {
    fontSize: 30,
    marginBottom: 20,
    color: '#1f18a1',
    fontFamily: 'NB',
    textAlign: 'center',
    opacity:0.77,
  },
  errorText: {
    fontSize:15,
    fontFamily:'NB',
    color: 'red',
    marginBottom: 5,
    textAlign: 'center',
  },
  outputText: {
    fontSize:15,
    fontFamily:'NB',
    color: 'rgb(24, 241, 205)',
    marginBottom: 5,
    textAlign: 'center',
    marginBottom:20
  },
  input: {
    height: 45,
    width: '95%',
    borderColor: '#1e90ff',
    borderWidth: 3,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 14,
    fontFamily: 'NR',
    opacity: 0.8,
  },
  loginButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    padding: 8,
    paddingHorizontal:40,
    marginTop:10,
    borderWidth: 3,
    borderColor: '#1e90ff',
    opacity: 0.75,
  },
  loginButtonText: {
    color: '#1e90ff',
    fontSize: 15,
    alignSelf: 'center',
    fontFamily: 'NB',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    marginLeft: 0,
  },
  toggleBtn: {
    alignSelf: 'center',
    justifyContent: 'center',
    paddingLeft: 5,
  },
  inputs: {
    height: 45,
    width: '95%',
    borderColor: '#1e90ff',
    borderWidth: 3,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    opacity: 0.8,
  },
});

export default LoginScreen;
