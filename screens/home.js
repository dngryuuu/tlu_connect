import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import {
  ImageBackground,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import * as ImagePicker from 'expo-image-picker';
import { processFullSchedule, findUpcomingSession } from '../utils/scheduleProcessor';
import { clearAuthData } from '../utils/authUtils';
import { processAndScheduleLocalNotifications } from '../utils/notificationUtils';
import { set } from 'date-fns';

var mockSchedule = [];

const mockGrades = [];

const HomeScreen = ({ route, navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isBackgroundLoaded, setIsBackgroundLoaded] = useState(false);
  const [theme, setTheme] = useState('white');
  var upcoming;

  // Sử dụng một state riêng cho username để đảm bảo cập nhật UI
  const [currentUsername, setCurrentUsername] = useState('');

  useEffect(() => {
    const load = async () => {
      await AsyncStorage.getItem('grades').then(grade => {
        grade ? setGrades(JSON.parse(grade)) : console.log('Không có dữ liệu điểm trong AsyncStorage')
      })
      try {

        let fetchedUser = route?.params?.userName;
        if (!fetchedUser) {
          fetchedUser = await AsyncStorage.getItem('username');
        }
        setCurrentUsername(fetchedUser || '');

        const data = await AsyncStorage.getItem('schedule');
        let scheduleData = mockSchedule;
        if (data) {
          try {
            scheduleData = JSON.parse(data);         
            await processAndScheduleLocalNotifications(scheduleData);
          } catch (error) {
            console.log("Lỗi xử lý thông báo hoặc parse dữ liệu lịch trình:", error);

          }
        }

        const themeColor = await AsyncStorage.getItem('app_theme');
        if (themeColor === 'dark') {
          setTheme('#333333');
        } else {
          setTheme('white');
        }

        if (route?.params?.upcomingsub) {
          upcoming = route?.params?.upcomingsub;
          setSchedule(route?.params?.scheduleData || mockSchedule);
        } else {
          upcoming = findUpcomingSession(scheduleData);
          setSchedule(scheduleData);
        }
        setUpcomingEvent(upcoming || {});

        const savedUri = await AsyncStorage.getItem('backgroundImage');
        if (savedUri) {
          setBackgroundImageUri(savedUri);
        }
      } catch (error) {
        console.error("Lỗi trong quá trình tải dữ liệu ban đầu:", error);

        setSchedule(mockSchedule);
        setUpcomingEvent({});
        setTheme('white');
        setCurrentUsername('');
      }
      finally {
        setIsLoading(false);
      }
    };
    load();
  }, [route?.params?.user, route?.params?.upcomingsub, route?.params?.scheduleData]); // Thêm dependencies

  const userData = {
    name: currentUsername,
    avatarUrl: '../assets/login_logo.png',
  };
  const mockUpcomingEvent = {}; 
  const [upcomingEvent, setUpcomingEvent] = useState(mockUpcomingEvent);
  const [schedule, setSchedule] = useState(mockSchedule);
  const [grades, setGrades] = useState(mockGrades);
  const [backgroundImageUri, setBackgroundImageUri] = useState(null);

  const handleLogout = () => {
    clearAuthData();
    navigation.replace('Login');
  };

  const handleSetting = () => {
    navigation.navigate('Settings');
  };

  const handleViewAllSchedule = () => {
    navigation.navigate('Schedule');
  };

  const handleViewAllGrades = () => {
    console.log('View all grades');
    navigation.navigate('Grade');
  };

  const handleQuickLinkPress = (screenName) => {
    navigation.navigate(screenName);
  };

  const pickImage = async () => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('TLU Connect', 'Bạn cần cấp quyền truy cập thư viện ảnh!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setBackgroundImageUri(uri);
      await AsyncStorage.setItem('backgroundImage', uri);
    }
  };

  const resetBackground = async () => {
    await AsyncStorage.removeItem('backgroundImage');
    setBackgroundImageUri(null);
  };

  // Các thành phần giao diện con giờ sẽ nhận 'currentTheme' làm prop
  const Header = ({ user, onLogout, onSetting, currentTheme }) => (
    <View style={[styles.headerContainer, { backgroundColor: currentTheme }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity style={styles.avatar} onPress={onSetting}>
          <Ionicons name="settings-outline" size={25} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.welcomeText}>Xin chào, {user.name || "Người dùng"}!</Text>
      </View>
      <TouchableOpacity onPress={onLogout}>
        <Ionicons name="log-out-outline" size={24} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );

  const UpcomingEventCard = ({ event, currentTheme }) => (
    <View style={[styles.upcomingEventCard, { backgroundColor: currentTheme == '#333333' ? '#333333' : 'white' }]}>
      <Text style={styles.upcomingEventTitle}>Buổi học sắp tới</Text>
      <View style={[styles.separators, { backgroundColor: "#007AFF" }]} />
      <Text style={styles.upcomingEventSubject}>{event?.subjectName || "Chưa có"}</Text>
      <Text style={styles.upcomingEventText}>Giảng Viên : {event?.teacherName || "N/A"}</Text>
      <Text style={styles.upcomingEventText}>Tại : {event?.roomName || "N/A"}  |  {event?.startTimeFormatted || ""} - {event?.endTimeFormatted || ""}</Text>
      <Text style={styles.upcomingEventText}>Thứ {event?.dayOfWeek || "N/A"} - {event?.date || "N/A"}</Text>
    </View>
  );

  const SectionTitle = ({ title, onViewAllPress }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onViewAllPress && (
        <TouchableOpacity onPress={onViewAllPress}>
          <Text style={styles.viewAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const ScheduleItem = ({ item, currentTheme }) => (
    <View style={[styles.scheduleItemCard, { backgroundColor: currentTheme == '#333333' ? '#1c1c1c' : 'white' }]}>
      <Text style={styles.scheduleItemSubject}>{item.subjectName}</Text>
      <Text style={[styles.scheduleItemDetail,{ color: theme == '#333333' ? '#93a3bd' : '#555',}]}>Tại : {item.roomName}  |  {item.startTimeFormatted} - {item.endTimeFormatted}</Text>
      <Text style={[styles.scheduleItemDetail,{ color: theme == '#333333' ? '#93a3bd' : '#555',}]}>Thứ {item.dayOfWeek} - {item.date}</Text>
    </View>
  );

  const GradesPreviewCard = ({ grades, onViewAllPress, currentTheme }) => (
    <View style={[styles.gradesPreviewContainer, { backgroundColor: currentTheme }]}>
      <SectionTitle title="Điểm Thi Mới" onViewAllPress={onViewAllPress} />
      {grades.slice(0,grades.length).map((grade, index) => (
        <View key={grade.id || `grade-${index}`} style={styles.gradeItem}>
          <Text style={styles.gradeSubject}>{grade.subject.subjectName}</Text>
          <Text style={styles.gradeScore}>{grade.mark}</Text>
        </View>
      ))}
      {grades.length === 0  && <Text style={styles.noDataText}>Truy cập mục Điểm Thi để tải dữ liệu lần đầu tiên.</Text>}
    </View>
  );

  if (isLoading) {
    return (
      // backgroundColor cho loadingContainer có thể giữ cố định hoặc dùng theme nếu muốn
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: '#f0f2f5'}]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (

      <SafeAreaView style={[styles.safeArea,{backgroundColor: theme == '#333333' ? '#1c1c1c' : 'white',flex:1}]}>
      <Header onSetting={handleSetting} user={userData} onLogout={handleLogout} currentTheme={theme} />
      <ImageBackground
        onLoadEnd={() => setIsBackgroundLoaded(true)}
        source={
          backgroundImageUri
            ? { uri: backgroundImageUri }
            : require('../assets/loginBackground.jpg')
        }
        style={styles.backgroundImage} // backgroundImage không có backgroundColor trong styles
        resizeMode="cover"
      >
        {isBackgroundLoaded ? (
          
          <ScrollView
            style={styles.container} // container không có backgroundColor trong styles
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer} // scrollContentContainer không có backgroundColor
          >
            <UpcomingEventCard event={upcomingEvent} currentTheme={theme} />
            <View style={[styles.quickLinksWrapper, { backgroundColor: theme }]}>
              <SectionTitle title="Tùy Chọn" />
              <View style={[styles.separator, { backgroundColor: "#007AFF" }]} />
              <View style={styles.quickLinksContainer}>
                <TouchableOpacity style={styles.quickLinkButton} onPress={() => handleQuickLinkPress('Schedule')}>
                  <Ionicons name="calendar-number-outline" size={24} color="#007AFF" />
                  <Text style={styles.quickLinkText}>Lịch Học</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickLinkButton} onPress={() => handleQuickLinkPress('Grade')}>
                  <Ionicons name="school-outline" size={24} color="#007AFF" />
                  <Text style={styles.quickLinkText}>Điểm Thi</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickLinkButton} onPress={() => handleQuickLinkPress('Payment')}>
                  <Ionicons name="cash-outline" size={24} color="#007AFF" />
                  <Text style={styles.quickLinkText}>Học Phí</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickLinkButton} onPress={() => handleQuickLinkPress('Exam')}>
                  <Ionicons name="today-outline" size={24} color="#007AFF" />
                  <Text style={styles.quickLinkText}>Lịch Thi</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.scheduleBox, { backgroundColor: theme }]}>
              <SectionTitle title="Lịch Học Sắp Tới" onViewAllPress={handleViewAllSchedule} />
              <View style={[styles.separator, {backgroundColor: "#007AFF"}]} />
              <FlatList
                horizontal
                data={schedule.slice(0, 4)}
                renderItem={({ item }) => <ScheduleItem item={item} currentTheme={theme} />}
                keyExtractor={(item, index) => item.id || `schedule-item-${index}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalListContent}
              />
            </View>
            <GradesPreviewCard grades={grades} onViewAllPress={handleViewAllGrades} currentTheme={theme} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', margin: 20 }}>
              <TouchableOpacity style={[styles.editBackgroundButton, { backgroundColor: theme }]} onPress={pickImage}>
                <Ionicons  name="image-outline" size={28} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.editBackgroundButton, { backgroundColor: theme }]} onPress={resetBackground}>
                <Ionicons  name="arrow-undo-outline" size={28} color="#007AFF" />
                <Text style={styles.editBackgroundText}>Khôi phục hình nền gốc</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
      </ImageBackground>
    </SafeAreaView>
    
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1
  },
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 50,
  },
  quickLinksWrapper: {
    marginHorizontal: 20,
    paddingBottom: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    marginBottom: 10,
    marginTop: 20,
    opacity: 0.8,
  },
  headerContainer: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    opacity: 0.86,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    alignSelf: 'center',
    alignItems: 'center',
    padding: 5,
    marginRight: 10,
  },
  welcomeText: {
    fontSize: 15.5,
    color: '#0052cc',
    fontFamily: 'NB',
    opacity: 1,
  },
  upcomingEventCard: {
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 30,
    opacity: 0.9,
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  upcomingEventTitle: {
    fontSize: 16.5,
    color: '#1c12a4ff',
    marginBottom: 10,
    fontFamily: 'NB',
    textAlign: 'center',
  },
  upcomingEventSubject: {
    fontSize: 20,
    color: '#0052cc',
    marginBottom: 2,
    marginTop: 2,
    fontFamily: 'NB',
    textAlign: 'center',
  },
  upcomingEventText: {
    fontSize: 13,
    color: '#0052cc',
    fontFamily: 'NB',
    textAlign: 'center',
    padding: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    color: '#007AFF',
    fontFamily: 'NB',
    marginTop: -3,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'NB',
    marginTop: -4,
    padding: 2,
  },
  horizontalListContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  scheduleItemCard: {
    borderRadius: 10,
    padding: 15,
    marginRight: 20,
    paddingBottom: 15,
    width: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },
  scheduleItemSubject: {
    textAlign: 'auto',
    fontSize: 15,
    color: '#007AFF',
    fontFamily: 'NB',
  },
  scheduleItemDetail: {
    textAlign: 'auto',
    fontSize: 13,
    marginTop: 4,
    fontFamily: 'NR',
  },
  gradesPreviewContainer: {
    borderRadius: 10,
    paddingVertical: 20,
    paddingTop: 0,
    marginHorizontal: 20,
    marginTop: 20,
    borderColor: '#007AFF',
    borderWidth: 2,
    opacity: 0.8,
  },
  gradeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  gradeSubject: {
    fontSize: 13,
    color: '#555',
    fontFamily:'NB',
    color : '#007AFF'
  },
  gradeScore: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  quickLinksContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  quickLinkButton: {
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 5,
  },
  quickLinkText: {
    marginTop: 5,
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    fontFamily: 'NR',
  },
  noDataText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scheduleBox: {
    marginHorizontal: 20,
    marginTop: 10,
    paddingTop: 0,
    paddingBottom: 15,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    opacity: 0.83,
  },
  editBackgroundButton: {
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
    borderRadius: 12,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#007AFF',
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#f0f2f5',
  },
  editBackgroundText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'NB',
  },
  separator: { // backgroundColor cho separator thường là màu cố định, không phải theme chung
    height: 2,
    // backgroundColor: '#007AFF',
    marginHorizontal: 15,
    marginBottom: 10,
    opacity: 0.8,
  },
  separators: { // Tương tự separator
    height: 2,
    // backgroundColor: '#007AFF',
    marginHorizontal: 5,
    marginBottom: 5,
    opacity: 0.8,
  },
});

export default HomeScreen;
