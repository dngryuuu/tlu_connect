import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert, FlatList, Platform, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons'; 
import { checkAndAutoLoginStatus } from '../utils/authUtils'; // Import hàm kiểm tra token
import { parse, isPast, isValid } from 'date-fns'; // Import parse, isPast, isValid từ date-fns
import { vi } from 'date-fns/locale'; // Import locale tiếng Việt
import AsyncStorage from '@react-native-async-storage/async-storage';

const ExamScheduleScreen = ({ navigation }) => {
    const [examSchedule, setExamSchedule] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [theme, setTheme] = useState('white');


    useEffect(() => {
        const fetchExamSchedule = async () => {
            await AsyncStorage.getItem('app_theme').then(currentTheme => {
                if (currentTheme) {
                    setTheme(currentTheme);
                }
            })
            const token = await checkAndAutoLoginStatus(); // Lấy token

            console.log("ExamScheduleScreen: Bắt đầu tải dữ liệu lịch thi...");
            setIsLoading(true);
            setError(null);

            try {
                const mainAppHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8,fr;q=0.7,fr-FR;q=0.6',
                'Connection': 'keep-alive',
                'Authorization': `Bearer ${token}`,
                'withCredentials': true,
            };

                // TODO: Thay thế URL API lịch thi thật của bạn
                const response = await axios.post('https://scheduleapi-khaki.vercel.app/api/exam', mainAppHeaders );

                if (response.data && Array.isArray(response.data)) {
                    const processedExamSchedule = response.data.map(item => {
                         // Không cần format ngày giờ ở đây nữa, sẽ format trong renderItem
                         return {
                             ...item,
                             // Tạo ID duy nhất nếu API không cung cấp
                             id: item.id || `${item.subject?.subjectCode}-${item.examRoom?.examDateString}-${item.examRoom?.examHour?.startString}`
                         };
                    });
                    setExamSchedule(processedExamSchedule);
                    console.log(`ExamScheduleScreen: Đã tải thành công ${processedExamSchedule.length} mục lịch thi.`);
                } else {
                    console.warn("ExamScheduleScreen: Dữ liệu lịch thi từ API không phải là mảng hoặc trống.", response.data);
                    setExamSchedule([]);
                }

            } catch (err) {
                console.error('ExamScheduleScreen: Lỗi khi tải lịch thi:', err);
                let errorMessage = "Không thể tải lịch thi. Vui lòng thử lại.";
                 if (axios.isAxiosError(err)) {
                     if (err.response) {
                         errorMessage = `Lỗi từ server (${err.response.status}): ${err.response.data?.message || err.response.data?.error_description || 'Không rõ lỗi'}`;
                     } else if (err.request) {
                         errorMessage = "Không thể kết nối đến máy chủ lịch thi. Vui lòng kiểm tra kết nối mạng.";
                     } else {
                         errorMessage = `Lỗi khi gửi yêu cầu: ${err.message}`;
                     }
                 } else {
                     errorMessage = `Đã xảy ra lỗi không xác định: ${err.message || 'Vui lòng thử lại.'}`;
                 }
                setError(errorMessage);
                setExamSchedule([]);
            } finally {
                setIsLoading(false);
                console.log("ExamScheduleScreen: Tải lịch thi hoàn tất.");
            }
        };

        fetchExamSchedule();
    }, []);

    const handleGoBack = () => {
        if (navigation && navigation.goBack) {
            navigation.goBack();
        } else {
            console.warn("Navigation prop is not available or does not have goBack method.");
        }
    };

    // Component render từng mục lịch thi trong FlatList
    const renderExamItem = ({ item }) => {
        // --- LOGIC KIỂM TRA THỜI GIAN VÀ XÁC ĐỊNH TRẠNG THÁI ---
        let statusText = '';
        let statusColor = '#007AFF'; // Màu xanh dương cho "sắp tới"
        let examEndTime = null;

        // Kiểm tra xem các trường ngày và giờ có tồn tại và là chuỗi không rỗng
        if (item.examRoom?.examDateString && item.examRoom?.examHour?.endString) {
            try {
                // Kết hợp ngày và giờ kết thúc thành một chuỗi
                const dateTimeString = `${item.examRoom.examDateString} ${item.examRoom.examHour.endString}`;
                // Định dạng chuỗi ngày giờ: "dd/MM/yyyy HH:mm"
                const formatString = 'dd/MM/yyyy HH:mm';

                // Phân tích cú pháp chuỗi ngày giờ thành đối tượng Date
                // Sử dụng locale vi để parse định dạng ngày dd/MM/yyyy
                examEndTime = parse(dateTimeString, formatString, new Date(), { locale: vi });

                // Kiểm tra xem đối tượng Date có hợp lệ không
                if (isValid(examEndTime)) {
                    // So sánh với thời gian hiện tại
                    if (isPast(examEndTime)) {
                        statusText = 'Đã thi';
                        statusColor = '#ff3b30'; // Màu đỏ cho "đã thi"
                    } else {
                        statusText = 'Sắp tới';
                        statusColor = '#007AFF'; // Màu xanh dương cho "sắp tới"
                    }
                } else {
                    console.warn("renderExamItem: Could not parse exam end time string:", dateTimeString);
                    statusText = 'Không rõ trạng thái';
                    statusColor = '#888'; // Màu xám cho trạng thái không rõ
                }
            } catch (parseError) {
                console.error("renderExamItem: Error parsing exam time string:", parseError);
                statusText = 'Lỗi trạng thái';
                statusColor = '#888'; // Màu xám cho lỗi
            }
        } else {
             console.warn("renderExamItem: Missing exam date or end time string for item:", item);
             statusText = 'Không rõ trạng thái';
             statusColor = '#888'; // Màu xám cho trạng thái không rõ
        }
        // --- KẾT THÚC LOGIC KIỂM TRA THỜI GIAN ---


        return (
            <View style={[styles.examItem,{backgroundColor : theme == 'dark' ? '#2e2d2b' : 'white',opacity:1}]}>
                <View style={styles.examInfo}>
                    <View style={styles.subjectStatusContainer}>
                         <Text style={styles.examSubject}>{item.subjectName || item.subject?.subjectCode || 'Không rõ môn học'}</Text>
                         <Text style={[styles.examSubject, { color: statusColor }]}>({statusText})</Text>
                    </View>
                    <Text style={styles.examSBD}><Ionicons  name="radio-button-off-outline" size={14} color="#555" /> SBD : {item.examCode || 'N/A'}</Text>
                    <Text style={styles.examDetail}><Ionicons  name="calendar-outline" size={14} color="#555" /> Ngày : {item.examRoom?.examDateString || 'Không rõ ngày'}</Text>
                    <Text style={styles.examDetail}><Ionicons  name="time-outline" size={14} color="#555" /> Thời gian : {item.examRoom?.examHour?.startString || 'N/A'} - {item.examRoom?.examHour?.endString || 'N/A'}</Text>
                    <Text style={styles.examDetail}><Ionicons  name="location-outline" size={14} color="#555" /> Phòng : {item.examRoom?.room?.name || 'Không rõ phòng'}</Text>
                    {item.method && <Text style={styles.examDetail}><Ionicons  name="pencil-outline" size={14} color="#555" /> Hình thức: {item.method}</Text>}
                    {item.note && <Text style={styles.examDetail}><Ionicons  name="information-circle-outline" size={14} color="#555" /> Ghi chú: {item.note}</Text>}
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.loadingContainer,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Đang tải lịch thi...</Text>
            </SafeAreaView>
        );
    }

    if (error || examSchedule.length === 0) {
         return (
             <SafeAreaView style={[styles.safeArea,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
                 <View style={[styles.headerBar,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
                     <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
                         <Ionicons  name="arrow-back-outline" size={28} color="#007AFF" />
                     </TouchableOpacity>
                     <Text style={styles.headerTitle}>Lịch Thi Học Kì Chính</Text>
                 </View>
                 <View style={styles.messageContainer}>
                    <Text style={styles.noDataText}>Không có dữ liệu lịch thi.</Text>
                 </View>
             </SafeAreaView>
         );
    }

    return (
        <SafeAreaView style={[styles.safeArea,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
            <View style={[styles.headerBar,{backgroundColor : theme == 'dark' ? 'black' : 'white',opacity:0.8}]}>
                <TouchableOpacity onPress={handleGoBack} style={styles.headerButton}>
                    <Ionicons  name="arrow-back-outline" size={28} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch Thi Học Kì Chính</Text>
            </View>
            <FlatList
                data={examSchedule}
                renderItem={renderExamItem}
                keyExtractor={(item) => item.id ? item.id.toString() : `${item.subject?.subjectCode}-${item.examRoom?.examDateString}-${item.examRoom?.examHour?.startString}`} // Sử dụng ID làm key, fallback bằng kết hợp các trường
                contentContainerStyle={styles.listContentContainer}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
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
    headerTitle: { // Cho phép tiêu đề chiếm hết không gian còn lại
        fontSize: 20,
        color: '#333',
        textAlign: 'center',
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
    messageContainer: {
         flex: 1,
         justifyContent: 'center',
         alignItems: 'center',
         padding: 20,
    },
     errorText: {
         fontSize: 16,
         color: 'red',
         textAlign: 'center',
         marginBottom: 10,
         fontFamily: 'NR',
     },
      errorTextDetail: {
         fontSize: 14,
         color: '#555',
         textAlign: 'center',
         fontFamily: 'NR',
     },
    noDataText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        fontFamily:'NR'
    },
    listContentContainer: {
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    examItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 15,
        marginHorizontal: 10,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2, // Thêm elevation cho Android
    },
    examInfo: {
        flex: 1,
        marginRight: 0,
    },
    // --- STYLE CHO CONTAINER MÔN HỌC VÀ TRẠNG THÁI ---
    subjectStatusContainer: {
        flexDirection: 'row', // Sắp xếp theo hàng
        alignItems: 'center', // Căn giữa theo chiều dọc
        marginBottom: 4, // Khoảng cách dưới
        flexWrap: 'wrap', // Cho phép xuống dòng nếu quá dài
    },
    examSubject: {
        fontSize: 19,
        color: '#007AFF',
        fontFamily:'NB',
        marginRight: 5, // Khoảng cách giữa tên môn học và trạng thái
        // flexShrink: 1, // Cho phép co lại nếu cần
    },
     examStatus: {
         fontSize: 15, // Kích thước chữ nhỏ hơn tên môn học
         fontFamily: 'NB', // Font đậm
         // color sẽ được set động
     },
    // --- KẾT THÚC STYLE ---
    examSBD: {
        // flexDirection: 'center', // Thuộc tính này không có tác dụng trên Text, nên bỏ đi
        fontSize: 15,
        color: '#555',
        marginBottom: 3,
        fontFamily:'NB'
    },
    examDetail: {
        fontSize: 13,
        color: '#555',
        marginBottom: 3,
        fontFamily:'NR'
    },
});

export default ExamScheduleScreen;
