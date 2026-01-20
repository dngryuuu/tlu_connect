import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; 
import Slider from '@react-native-community/slider'; // Import Slider component
import { processAndScheduleLocalNotifications } from '../utils/notificationUtils';

// Hằng số cho theme
const THEME_STORAGE_KEY = 'app_theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

// Hằng số cho cài đặt thời gian thông báo
const NOTIFICATION_TIME_STORAGE_KEY = 'notification_time_before_class';
const DEFAULT_NOTIFICATION_TIME = 15; // Mặc định thông báo trước 15 phút
const MIN_NOTIFICATION_TIME = 5; // Thời gian thông báo tối thiểu (phút)
const MAX_NOTIFICATION_TIME = 120; // Thời gian thông báo tối đa (120 phút = 2 tiếng)
const NOTIFICATION_TIME_STEP = 5; // Bước nhảy của thanh trượt (5 phút)


const SettingsScreen = ({ navigation }) => {
  // State cho theme
  const [currentTheme, setCurrentTheme] = useState(THEME_LIGHT);
  // State cho thời gian thông báo (sử dụng giá trị số)
  const [notificationTime, setNotificationTime] = useState(DEFAULT_NOTIFICATION_TIME);

  // useEffect để tải cài đặt đã lưu từ AsyncStorage khi màn hình được mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Tải theme
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme !== null) {
          setCurrentTheme(savedTheme);
        } else {
          // Nếu chưa có, lưu giá trị mặc định (light)
          await AsyncStorage.setItem(THEME_STORAGE_KEY, THEME_LIGHT);
          setCurrentTheme(THEME_LIGHT);
        }

        // Tải thời gian thông báo
        const savedNotificationTime = await AsyncStorage.getItem(NOTIFICATION_TIME_STORAGE_KEY);
        if (savedNotificationTime !== null) {
          // Chuyển đổi từ string sang number và đảm bảo nằm trong khoảng min/max
          const parsedTime = parseInt(savedNotificationTime, 10);
          if (!isNaN(parsedTime)) {
             setNotificationTime(Math.max(MIN_NOTIFICATION_TIME, Math.min(MAX_NOTIFICATION_TIME, parsedTime)));
          } else {
             // Nếu giá trị lưu không hợp lệ, dùng mặc định
             setNotificationTime(DEFAULT_NOTIFICATION_TIME);
             await AsyncStorage.setItem(NOTIFICATION_TIME_STORAGE_KEY, DEFAULT_NOTIFICATION_TIME.toString());
          }
        } else {
          // Nếu chưa có, lưu giá trị mặc định
          await AsyncStorage.setItem(NOTIFICATION_TIME_STORAGE_KEY, DEFAULT_NOTIFICATION_TIME.toString());
          setNotificationTime(DEFAULT_NOTIFICATION_TIME);
        }

      } catch (error) {
        console.error('Error loading settings from AsyncStorage:', error);
        Alert.alert("Lỗi", "Không thể tải cài đặt.");
      }
    };

    loadSettings();
  }, []); // Dependency array rỗng, effect chỉ chạy một lần khi mount


  // Hàm xử lý khi người dùng chọn một giao diện mới
  const handleThemeChange = async (theme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      setCurrentTheme(theme);
      console.log(`Theme changed to: ${theme}`);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      console.error('Error saving theme to AsyncStorage:', error);
      Alert.alert("Lỗi", "Không thể lưu cài đặt giao diện.");
    }
  };

  // Hàm xử lý khi giá trị thanh trượt thay đổi (đang kéo)
  // Sử dụng useCallback để tránh tạo lại hàm không cần thiết
  const onSliderValueChange = useCallback((value) => {
      // Cập nhật state notificationTime với giá trị làm tròn theo step
      // Math.round(value / NOTIFICATION_TIME_STEP) * NOTIFICATION_TIME_STEP
      // Đảm bảo giá trị cuối cùng nằm trong khoảng min/max
      const roundedValue = Math.round(value / NOTIFICATION_TIME_STEP) * NOTIFICATION_TIME_STEP;
      setNotificationTime(Math.max(MIN_NOTIFICATION_TIME, Math.min(MAX_NOTIFICATION_TIME, roundedValue)));
  }, []);


  // Hàm xử lý khi người dùng thả thanh trượt (kết thúc kéo)
  const onSliderSlidingComplete = async (value) => {
      try {
          // Làm tròn giá trị cuối cùng theo step trước khi lưu
          const finalValue = Math.max(MIN_NOTIFICATION_TIME, Math.min(MAX_NOTIFICATION_TIME, Math.round(value / NOTIFICATION_TIME_STEP) * NOTIFICATION_TIME_STEP));
          // Lưu giá trị cuối cùng vào AsyncStorage (chuyển sang string)
          await AsyncStorage.setItem(NOTIFICATION_TIME_STORAGE_KEY, finalValue.toString());
          // Cập nhật state (đã làm trong onSliderValueChange, nhưng làm lại ở đây đảm bảo giá trị lưu là chính xác)
          setNotificationTime(finalValue);
          console.log(`Notification time saved to: ${finalValue} minutes`);
          const data = await AsyncStorage.getItem('schedule')
          await processAndScheduleLocalNotifications(JSON.parse(data))
      } catch (error) {
          console.error('Error saving notification time to AsyncStorage:', error);
          Alert.alert("Lỗi", "Không thể lưu cài đặt thời gian thông báo.");
      }
  };


  // Dựa vào giao diện hiện tại để xác định styles
  const containerStyle = currentTheme === THEME_DARK ? styles.containerDark : styles.containerLight;
  const textStyle = currentTheme === THEME_DARK ? styles.textDark : styles.textLight;
  const sectionBackgroundStyle = currentTheme === THEME_DARK ? styles.settingSectionDark : styles.settingSectionLight;
  const headerStyle = currentTheme === THEME_DARK ? styles.headerDark : styles.headerLight;


  return (
    <SafeAreaView style={[styles.container, containerStyle]}>
      {/* Header */}
      <View style={[styles.header, headerStyle]}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons  name="arrow-back" size={24} color={currentTheme === THEME_DARK ? '#fff' : '#333'} />
         </TouchableOpacity>
         {/* Áp dụng font NB cho tiêu đề Header */}
         <Text style={[styles.headerTitle, textStyle, { fontFamily: 'NB' }]}>Cài đặt</Text>
      </View>

      {/* Sử dụng ScrollView để có thể cuộn nếu thêm nhiều cài đặt */}
      <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Phần cài đặt Giao diện */}
          <View style={[styles.settingSection, sectionBackgroundStyle]}>
            {/* Áp dụng font NB cho tiêu đề section */}
            <Text style={[styles.sectionTitle, textStyle, { fontFamily: 'NB' }]}>Giao diện</Text>
            {/* Container cho Segmented Control (Theme) */}
            <View style={[styles.segmentedControlContainer, currentTheme === THEME_DARK ? styles.segmentedControlContainerDark : styles.segmentedControlContainerLight]}>
              {/* Nút chọn giao diện Sáng */}
              <TouchableOpacity
                style={[
                  styles.segmentedControlButton,
                  currentTheme === THEME_LIGHT ? styles.segmentedControlButtonSelected : styles.segmentedControlButtonUnselected
                ]}
                onPress={() => handleThemeChange(THEME_LIGHT)}
              >
                {/* Áp dụng font NB cho text nút được chọn, NR cho text nút chưa chọn */}
                <Text style={[
                  styles.segmentedControlButtonText,
                  currentTheme === THEME_LIGHT ? styles.segmentedControlButtonTextSelected : (currentTheme === THEME_DARK ? styles.segmentedControlButtonTextUnselectedDark : styles.segmentedControlButtonTextUnselectedLight),
                   { fontFamily: currentTheme === THEME_LIGHT ? 'NB' : 'NR' } // Áp dụng font
                ]}>Light</Text>
              </TouchableOpacity>

              {/* Nút chọn giao diện Tối */}
              <TouchableOpacity
                style={[
                  styles.segmentedControlButton,
                  currentTheme === THEME_DARK ? styles.segmentedControlButtonSelected : styles.segmentedControlButtonUnselected
                ]}
                onPress={() => handleThemeChange(THEME_DARK)}
              >
                {/* Áp dụng font NB cho text nút được chọn, NR cho text nút chưa chọn */}
                <Text style={[
                  styles.segmentedControlButtonText,
                  currentTheme === THEME_DARK ? styles.segmentedControlButtonTextSelected : (currentTheme === THEME_DARK ? styles.segmentedControlButtonTextUnselectedDark : styles.segmentedControlButtonTextUnselectedLight),
                  { fontFamily: currentTheme === THEME_DARK ? 'NB' : 'NR' } // Áp dụng font
                ]}>Dark</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Phần cài đặt Thời gian thông báo */}
          <View style={[styles.settingSection, sectionBackgroundStyle]}>
              {/* Áp dụng font NB cho tiêu đề section */}
              <Text style={[styles.sectionTitle, textStyle, { fontFamily: 'NB',textAlign: 'center' }]}>Thông báo lịch học trước?</Text>
              {/* Hiển thị giá trị thời gian thông báo hiện tại - Áp dụng font NB */}
              <Text style={[styles.notificationTimeValue, textStyle, { fontFamily: 'NB' }]}>
                  {notificationTime} phút
              </Text>
              {/* Thanh trượt chọn thời gian thông báo */}
              <Slider
                  style={styles.slider}
                  minimumValue={MIN_NOTIFICATION_TIME} // Giá trị nhỏ nhất
                  maximumValue={MAX_NOTIFICATION_TIME} // Giá trị lớn nhất
                  step={NOTIFICATION_TIME_STEP} // Bước nhảy
                  value={notificationTime} // Giá trị hiện tại của slider
                  onValueChange={onSliderValueChange} // Sự kiện khi giá trị thay đổi (đang kéo)
                  onSlidingComplete={onSliderSlidingComplete} // Sự kiện khi người dùng thả thanh trượt
                  minimumTrackTintColor={currentTheme === THEME_DARK ? '#90bfff' : '#007AFF'} // Màu track bên trái
                  maximumTrackTintColor={currentTheme === THEME_DARK ? '#555' : '#ccc'} // Màu track bên phải
                  thumbTintColor={currentTheme === THEME_DARK ? '#fff' : '#007AFF'} // Màu của núm trượt
              />
                {/* Hiển thị khoảng giá trị min/max - Áp dụng font NR */}
                <View style={styles.sliderLabels}>
                    <Text style={[styles.sliderLabelText, textStyle, { fontFamily: 'NR' }]}>{MIN_NOTIFICATION_TIME} phút</Text>
                    <Text style={[styles.sliderLabelText, textStyle, { fontFamily: 'NR' }]}>{MAX_NOTIFICATION_TIME} phút</Text>
                </View>
          </View>


          {/* Bạn có thể thêm các phần cài đặt khác ở đây */}

      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Màu nền mặc định, sẽ bị ghi đè bởi containerLight/Dark
    backgroundColor: '#f0f0f0',
  },
  containerLight: {
    backgroundColor: '#f0f0f0',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
   header: {
     flexDirection: 'row',
     alignItems: 'center',
     padding: 15,
     borderBottomWidth: 1,
   },
   headerLight: {
       backgroundColor: '#fff',
       borderBottomColor: '#ccc',
   },
    headerDark: {
       backgroundColor: '#1e1e1e',
       borderBottomColor: '#333',
   },
    backButton: {
        marginRight: 10,
    },
   headerTitle: {
     fontSize: 20,
     // fontWeight: 'bold', // Đã loại bỏ fontWeight
   },
  textLight: {
    color: '#333',
  },
  textDark: {
    color: '#fff',
  },
  scrollContent: {
      paddingBottom: 20, // Thêm padding dưới để nội dung không bị cắt
  },
  settingSection: {
    margin: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
   settingSectionLight: {
       backgroundColor: '#fff',
   },
    settingSectionDark: {
       backgroundColor: '#1e1e1e',
   },
   sectionTitle: {
     fontSize: 18,
     // fontWeight: 'bold', // Đã loại bỏ fontWeight
     marginBottom: 15,
   },

   // --- Styles cho Segmented Control (Theme) ---
   segmentedControlContainer: {
       flexDirection: 'row',
       borderRadius: 8,
       borderWidth: 1,
       overflow: 'hidden',
   },
   segmentedControlContainerLight: {
       borderColor: '#007AFF',
   },
    segmentedControlContainerDark: {
       borderColor: '#555',
   },
   segmentedControlButton: {
       flex: 1,
       paddingVertical: 10,
       alignItems: 'center',
   },
    segmentedControlButtonUnselected: {
        backgroundColor: 'transparent',
    },
    segmentedControlButtonSelected: {
        backgroundColor: '#007AFF',
    },
   segmentedControlButtonText: {
       fontSize: 16,
       // fontWeight: '500', // Đã loại bỏ fontWeight
   },
    segmentedControlButtonTextUnselectedLight: {
        color: '#007AFF',
    },
     segmentedControlButtonTextUnselectedDark: {
        color: '#888',
    },
    segmentedControlButtonTextSelected: {
        color: '#fff',
        // fontWeight: 'bold', // Đã loại bỏ fontWeight
    },
   // --- Kết thúc Styles cho Segmented Control (Theme) ---

   // --- Styles cho Notification Time Slider ---
   notificationTimeValue: {
       fontSize: 16,
       textAlign: 'center',
       marginBottom: 10,
       // fontWeight: 'bold', // Đã loại bỏ fontWeight
   },
   slider: {
       width: '100%', // Chiếm toàn bộ chiều rộng container
       height: 40, // Chiều cao của slider
   },
    sliderLabels: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       marginTop: -5, // Đẩy lên gần slider
       paddingHorizontal: 5, // Padding ngang cho text
    },
    sliderLabelText: {
       fontSize: 12,
       // fontFamily sẽ được áp dụng inline
    },
   // --- Kết thúc Styles cho Notification Time Slider ---

});

export default SettingsScreen;
