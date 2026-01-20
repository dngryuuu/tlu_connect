import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import {
  Alert ,
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';  
import axios from 'axios';
import { checkAndAutoLoginStatus } from '../utils/authUtils';
import { StatusBar } from 'expo-status-bar';

var mockGradesData;
var GPA;
const getmark = async () => {
  const token = await checkAndAutoLoginStatus()
  const mainAppHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8,fr;q=0.7,fr-FR;q=0.6',
    'Connection': 'keep-alive',
    'Authorization': `Bearer ${token}`,
    'withCredentials': true,
  };

  const res = await axios.post(
    'https://scheduleapi-khaki.vercel.app/api/grades',
    mainAppHeaders 
  );
  console.log(res.data[1])
  return {grades : res.data[0],GPAs : res.data[1].mark4}
    
};
const GradesScreen = ({ navigation }) => {
  const [theme,setTheme] = useState('light')
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gpa, setGpa] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
    await AsyncStorage.getItem('app_theme').then(currantTheme => {
      if(currantTheme){
        setTheme(currantTheme)
      }
    })
    try {
      const {grades,GPAs} = await getmark();
      GPA = GPAs
      setGrades(grades);
      await AsyncStorage.setItem('grades',JSON.stringify(grades))
    } finally {
      setLoading(false);
    }
  };

  fetchData();
  }, []);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderGradeItem = ({ item }) => (
    <View style={[styles.gradeItem,{backgroundColor : theme == 'dark' ? '#1f1e1c' : '#f0f2f5'}]}>
      <View style={styles.subjectInfo}>
        <Text style={[styles.subjectText,{color: theme == 'dark' ? 'white' : '#555'}]}>{item.subject.subjectName} ({item.charMark})</Text>
        <Text style={styles.creditText}>Số tín chỉ: {item.subject.numberOfCredit}</Text>
        <Text style={styles.creditText}>Kì học: {item.semester.semesterName}</Text>
      </View>

      <View style={styles.scores}>
        {item.midterm !== null && (
          <Text style={styles.scoreDetailText}>
            Quá Trình : {item.details[0].mark?.toFixed(1) ?? 'N/A'}
          </Text>
        )}
        {item.final !== null && (
          <Text style={styles.scoreDetailText}>
            Thi kết thúc : {item.details[1].mark?.toFixed(1) ?? 'N/A'}
          </Text>
        )}
        <Text
          style={[
            styles.overallScoreText,
            typeof item.mark === 'number' && item.mark < 5 ? styles.failScore : {},
          ]}
        >
          Tổng: {typeof item.mark === 'number' ? item.mark.toFixed(1) : item.overall}
        </Text>
      </View>
    </View>
  );

  const renderHeaderContent = () => (
    <View style={[styles.summaryContainer,{backgroundColor : theme == 'dark' ? '#2e2d2b' : '#f0f2f5'}]}>
      <Text style={[styles.gpaTitle,{color: theme == 'dark' ? 'white' : '#555',}]}>Điểm Trung Bình Tích Lũy (GPA)</Text>
      <Text style={styles.gpaText}>{GPA}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang kiểm tra điểm thi...</Text>
      </SafeAreaView>
    );
  }

  return (
  <SafeAreaView style={[styles.safeArea,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
        <View style={[styles.headerBar, {backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
          <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
            <Ionicons name="arrow-back-outline" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle]}>
            Bảng Điểm
          </Text>
        </View>
{grades ? (
        <FlatList
          data={grades}
          renderItem={renderGradeItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeaderContent}
          contentContainerStyle={[styles.listContentContainer,]}
          showsVerticalScrollIndicator={false}
        />
      
    ) : (
      <View style={styles.noDataContainer}>
        <Text style={[styles.noDataText, { color: '#555' }]}>Không có dữ liệu điểm thi để hiển thị.</Text>
      </View>
    )}
  </SafeAreaView>
);}



const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 12 : 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    padding: 5,
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    fontFamily:'NB'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
    marginBottom: 10,
  },
  gpaTitle: {
    fontSize: 16,
    marginBottom: 5,
    fontFamily:'NB'
  },
  gpaText: {
    fontSize: 32,
    color: '#007AFF',
    fontFamily:'NB'
  },
  listContentContainer: {
    paddingBottom: 20,
  },
  gradeItem: {
    borderRadius: 8,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  subjectInfo: {
    flex: 3,
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily:'NB'
  },
  creditText: {
    fontSize: 13,
    color: '#777',
    fontFamily:'NR'
  },
  scores: {
    flex: 2,
    alignItems: 'flex-end',
  },
  scoreDetailText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
    fontFamily:'NR'
  },
  overallScoreText: {
    fontSize: 15,
    color: '#007AFF',
    fontFamily:'NR'
  },
  failScore: {
    color: '#D32F2F',
  },
   loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
    fontFamily:'NR'
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#555',
    fontFamily:'NR'
  }
});

export default GradesScreen;
