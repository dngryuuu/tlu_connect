import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons'; 
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  SectionList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isPast, parseISO, format, parse } from 'date-fns';
import { vi } from 'date-fns/locale';
import { schedulereload } from '../utils/ScheduleReload';


const ScheduleScreen = ({ navigation }) => {
  const [theme, setTheme] = useState('white');
  const [isLoading, setIsLoading] = useState(true);
  const [lichHoc, setLichHoc] = useState([]);

  useEffect(() => {
    const taiVaLocVaNhomLichHoc = async () => {
      await AsyncStorage.getItem('app_theme').then(currentTheme => {
        if (currentTheme) {
          setTheme(currentTheme);
        }
      })
      setIsLoading(true);
      try {
        const data = await AsyncStorage.getItem('schedule');
        let rawScheduleData = JSON.parse(data);
        console.log("Raw schedule data loaded:", data);
        if (!Array.isArray(rawScheduleData)) {
            console.error("Dữ liệu lịch học không phải là mảng:", rawScheduleData);
            setLichHoc([]);
            return;
        }

        const filteredItems = rawScheduleData.filter(item => {
            if (!item || typeof item.startTime !== 'string') {
                console.warn('Skipping invalid item (missing or invalid startTime):', item);
                return false;
            }
            try {
                const itemStartTime = parseISO(item.startTime);
                if (isNaN(itemStartTime.getTime())) {
                     console.warn(`Parsed startTime is invalid for item: ${item.startTime}`, item);
                     return false;
                }
                return !isPast(itemStartTime);
            } catch (error) {
                console.warn(`Error processing startTime for item: ${item.startTime}`, item, error);
                return false;
            }
        });

        const groupedSchedule = filteredItems.reduce((acc, item) => {
            const dateKey = item.date;
            if (typeof dateKey !== 'string') {
                 console.warn('Skipping item due to invalid date key:', item);
                 return acc;
            }

            let section = acc.find(sec => sec.dateSortKey === dateKey);

            if (!section) {
                 let formattedTitle = dateKey;
                 try {
                    const dateObj = parse(dateKey, 'dd-MM-yyyy', new Date(), { locale: vi });
                    if (!isNaN(dateObj.getTime())) {
                       formattedTitle = format(dateObj, 'EEEE, dd/MM/yyyy', { locale: vi });
                    } else {
                        console.warn(`Parsed dateKey is invalid: ${dateKey}`);
                    }
                 } catch (error) {
                     console.warn(`Error formatting date key ${dateKey}:`, error);
                 }

                section = {
                    title: formattedTitle,
                    data: [],
                    dateSortKey: dateKey
                };
                acc.push(section);
            }

            section.data.push(item);
            return acc;
        }, []);

        groupedSchedule.sort((a, b) => {
             if (typeof a.dateSortKey !== 'string' || typeof b.dateSortKey !== 'string') {
                 console.warn('Skipping sorting due to invalid dateSortKey');
                 return 0;
             }
            try {
                const dateA = parse(a.dateSortKey, 'dd-MM-yyyy', new Date());
                const dateB = parse(b.dateSortKey, 'dd-MM-yyyy', new Date());
                 if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                     console.warn(`Invalid date objects for sorting: ${a.dateSortKey}, ${b.dateSortKey}`);
                     return 0;
                 }
                return dateA.getTime() - dateB.getTime();
            } catch (error) {
                console.warn(`Error during section sorting for keys ${a.dateSortKey}, ${b.dateSortKey}:`, error);
                return 0;
            }
        });

        groupedSchedule.forEach(section => {
            section.data.sort((a, b) => {
                 if (typeof a.startTime !== 'string' || typeof b.startTime !== 'string') {
                     console.warn('Skipping item sorting in a section due to invalid startTime');
                     return 0;
                 }
                try {
                    const timeA = parseISO(a.startTime);
                    const timeB = parseISO(b.startTime);
                     if (isNaN(timeA.getTime()) || isNaN(timeB.getTime())) {
                         console.warn(`Invalid time objects for item sorting: ${a.startTime}, ${b.startTime}`);
                         return 0;
                     }
                    return timeA.getTime() - timeB.getTime();
                } catch (error) {
                    console.warn(`Error during item sorting for times ${a.startTime}, ${b.startTime}:`, error);
                    return 0;
                }
            });
        });

        setLichHoc(groupedSchedule);
      } catch (error) {
        console.error("Lỗi khi tải, lọc hoặc nhóm lịch học:", error);
        setLichHoc([]);
      } finally {
        setIsLoading(false);
      }
    };

    taiVaLocVaNhomLichHoc();
  }, []);
  const handleReload = async () => {
    setIsLoading(true);
    await schedulereload()
    await navigation.navigate('Home')
    navigation.navigate('Schedule')
  }
  const handleGoBack = () => {
      navigation.goBack();};
  const MucLichHoc = ({ startTimeFormatted, endTimeFormatted, subjectName, roomName, teacherName }) => (
  <View style={[styles.mucContainer,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:1}]}>
    <Text style={styles.mucThoiGian}>{`${startTimeFormatted} - ${endTimeFormatted}`}</Text>
    <View style={styles.mucChiTiet}>
      <Text style={styles.mucMonHoc}>{subjectName}</Text>
      <Text style={styles.mucPhongHoc}>Phòng: {roomName}</Text>
      {teacherName && <Text style={styles.mucGiangVien}>Giảng viên : {teacherName}</Text>}
    </View>
  </View>
);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8,}]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{color:'#555',fontFamily:'NR'}} >Đang tải lịch học...</Text>
      </SafeAreaView>
    );
  }

  if (lichHoc.length === 0) {
      return (
          <SafeAreaView style={[styles.container,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
              <View style={styles.header}>
                  <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                      <Ionicons  name="arrow-back-outline" size={28} color="#007AFF"/>
                  </TouchableOpacity>
                  <Text style={[styles.headerTitle,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>Lịch Học</Text>
                       <TouchableOpacity onPress={handleReload} style={styles.reloadButton}>
                      <Ionicons  name="reload-outline" size={23} color="#007AFF"/>
                  </TouchableOpacity>
              </View>
              <View style={styles.emptyMessageContainer}>
                  <Text style={styles.emptyMessageText}>Không có lịch học nào trong tương lai.</Text>
              </View>
          </SafeAreaView>
      );
  }

  return (
<SafeAreaView style={[styles.container,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
      <View style={[styles.header,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons  name="arrow-back-outline" size={28} color="#007AFF"/>
        </TouchableOpacity>
        <Text style={[styles.headerTitle,{color:theme == 'dark' ? 'white' : 'black'}]}>Lịch Học</Text>
        <TouchableOpacity onPress={handleReload} style={styles.reloadButton}>
                      <Ionicons  name="reload-outline" size={23} color="#007AFF"/>
                  </TouchableOpacity>
      </View>
      <SectionList
        sections={lichHoc}
        keyExtractor={(item, index) => item.id + index}
        renderItem={({ item }) => (
          <MucLichHoc
            startTimeFormatted={item.startTimeFormatted}
            endTimeFormatted={item.endTimeFormatted}
            subjectName={item.subjectName}
            roomName={item.roomName}
            teacherName={item.teacherName}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.tieuDeNgay,{backgroundColor: theme =='dark'? 'black':'#e0e0e0'}]}>{title}</Text>
        )}
        stickySectionHeadersEnabled={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    color : 'red'
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    color : 'red'
  },
  header: {
    justifyContent : 'space-between',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderBottomColor: '#E0E0E0',
    borderBottomWidth:1
  },
  backButton: {
    padding: 10,
    minWidth: 50,
  },
  reloadButton: {
    flexDirection:'row',
    marginLeft:175,
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    fontFamily:'NB'
  },
  tieuDeNgay: {
    fontSize: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth:2,
    borderBottomColor:'#007AFF',
    borderTopWidth:2,
    borderTopColor:'#007AFF',
    color: '#007AFF',
    fontFamily:'NB'
  },
  mucContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    alignItems: 'flex-start',
  },
  mucThoiGian: {
    fontSize: 18,
    alignSelf: 'center',
    color: '#007AFF',
    marginRight: 16,
    minWidth: 110,
    fontFamily:'NB'
  },
  mucChiTiet: {
    flex: 1,
    fontFamily:'NB'
  },
  mucMonHoc: {
    fontSize: 17,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 5,
    fontFamily:'NB'
  },
  mucPhongHoc: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 3,
    fontFamily:'NB'
  },
  mucGiangVien: {
    fontSize: 14,
    color: '#777777',
    fontStyle: 'italic',
    fontFamily:'NB'
  },
  emptyMessageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
  },
  emptyMessageText: {
      fontSize: 16,
      color: '#555',
      textAlign: 'center',
  },
});

export default ScheduleScreen;
