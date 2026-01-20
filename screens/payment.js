import axios from 'axios';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkAndAutoLoginStatus } from '../utils/authUtils';
import { StatusBar } from 'expo-status-bar';

var mockPaymentData

const PaymentScreen = ({ navigation }) => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('white')

  useEffect(() => {
    const fetchPaymentData = async () => {
      await AsyncStorage.getItem('app_theme').then(currentTheme => {
        if(currentTheme){
          setTheme(currentTheme)
        }
      })
      const token = await checkAndAutoLoginStatus()
      try {
        const mainAppHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8,fr;q=0.7,fr-FR;q=0.6',
    'Connection': 'keep-alive',
    'Authorization': `Bearer ${token}`,
    'withCredentials': true,
  };
    const res = await axios.post(
    'https://scheduleapi-khaki.vercel.app/api/payment',
    mainAppHeaders 
  );
    const fetchedData = res.data
    setPaymentData(fetchedData);
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentData();
  }, []);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return 'N/A';
    return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VNĐ';
  };
  if (loading) {
    return (
      <SafeAreaView style={[styles.loadingContainer,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang kiểm tra học phí...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
      <View style={[styles.headerBar,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
          <Ionicons name="arrow-back-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle,{color : theme == 'dark' ? 'white' : 'black',opacity:0.8}]}>Thông Tin Học Phí</Text>
      </View>

      {paymentData ? (
        <View style={[styles.contentContainer,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
          <View style={[styles.paymentItem,{backgroundColor : theme == 'dark' ? '#2e2d2b' : 'white',opacity:0.9}]}>
            <Text style={[styles.itemLabel,{color : theme == 'dark' ? 'white' : 'black',opacity:1}]}>{paymentData.receivedDtos[0].student.displayName}</Text>
            <Text style={[styles.itemValue, styles.paidValue]}>{paymentData.receivedDtos[0].student.bankAccount}</Text>
          </View>
          <View style={[styles.paymentItem,{backgroundColor : theme == 'dark' ? '#2e2d2b' : 'white',opacity:0.9}]}>
            <Text style={[styles.itemLabel,{color : theme == 'dark' ? 'white' : 'black',opacity:1}]}>Học phí phải đóng:</Text>
            <Text style={[styles.itemValue, styles.paidValue]}>
              {formatCurrency(paymentData.totalReceiveAble)}
            </Text>
          </View>
          <View style={[styles.paymentItem,{backgroundColor : theme == 'dark' ? '#2e2d2b' : 'white',opacity:0.9}]}>
            <Text style={[styles.itemLabel,{color : theme == 'dark' ? 'white' : 'black',opacity:1}]}>Học phí đã đóng:</Text>
            <Text style={[styles.itemValue, styles.paidValue]}>
              {formatCurrency(paymentData.totalReceived)}
            </Text>
          </View>
          <View style={[styles.paymentItem,{backgroundColor : theme == 'dark' ? '#2e2d2b' : 'white',opacity:0.9}]}>
            <Text style={[styles.itemLabel,{color : theme == 'dark' ? 'white' : 'black',opacity:1}]}>Còn nợ:</Text>
            <Text style={[styles.itemValue, styles.outstandingValue]}>
              {formatCurrency(paymentData.totalReceiveAbleNotComplete)}
            </Text>
          </View>
          <View style={[styles.paymentItem,{backgroundColor : theme == 'dark' ? '#2e2d2b' : 'white',opacity:0.9}]}>
            <Text style={[styles.itemLabel,{color : theme == 'dark' ? 'white' : 'black',opacity:1}]}>Học bổng:</Text>
            <Text style={[styles.itemValue, styles.otherValue]}>
              {formatCurrency(paymentData.totalPayAble)}
            </Text>
          </View>
          <View style={[styles.paymentItem,{backgroundColor : theme == 'dark' ? '#2e2d2b' : 'white',opacity:0.9}]}>
            <Text style={[styles.itemLabel,{color : theme == 'dark' ? 'white' : 'black',opacity:1}]}>Học bổng đã rút:</Text>
            <Text style={[styles.itemValue, styles.otherValue]}>
              {formatCurrency(paymentData.totalPayed)}
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.noDataContainer,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
          <Text style={styles.noDataText}>Không có dữ liệu để hiển thị.</Text>
        </View>
      )}
    </SafeAreaView>
  );

};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Platform.OS === 'ios' ? 12 : 15,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
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
    paddingHorizontal: 5,
    fontFamily:'NB'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
    fontFamily:'NR'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily:'NRR'
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily:'NB'
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    fontFamily:'NR'
  },
  contentContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f0f2f5',
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  itemLabel: {
    fontSize: 17,
    color: '#555',
    fontFamily:'NB'
  },
  itemValue: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop:2
  },
  paidValue: {
    color: 'green',
  },
  outstandingValue: {
    color: 'red',
  },
  otherValue: {
    color: '#007AFF',
  },
});

export default PaymentScreen;
