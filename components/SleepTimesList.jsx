import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

const MOCK_SLEEP_DATA = [
  { id: 1, title: 'Last night (Monday)', time: '2:11a – 7:26a', duration: '5h 4m' },
  { id: 2, title: 'Sunday night', time: '1:10a – 6:40a', duration: '5h 58m' },
  { id: 3, title: 'Saturday night', time: '2:45a – 7:15a', duration: '4h 39m' },
  { id: 4, title: 'Friday night', time: '12:30a – 7:00a', duration: '6h 52m' },
  { id: 5, title: 'Thursday night', time: '1:20a – 6:50a', duration: '5h 42m' },
  { id: 6, title: 'Wednesday night', time: '11:40p – 7:10a', duration: '6h 56m' },
  { id: 7, title: 'Tuesday night', time: '2:11a – 7:26a', duration: '5h 15m' },
];

export default function SleepTimesList() {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>All sleep times</Text>

      {MOCK_SLEEP_DATA.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.listItem}
          activeOpacity={0.7}
        >
          <View style={styles.listContent}>
            <View>
              <Text style={styles.listTitle}>{item.title}</Text>
              <Text style={styles.listTime}>{item.time}</Text>
            </View>
            <View style={styles.listRight}>
              <Text style={styles.listDuration}>{item.duration}</Text>
              <ChevronRight size={20} color="#A9AFB6" />
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  listItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  listContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  listTime: {
    fontSize: 14,
    color: '#A9AFB6',
  },
  listRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listDuration: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
