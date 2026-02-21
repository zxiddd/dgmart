import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../src/config/theme';

export default function SupportScreen() {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <TouchableOpacity style={styles.item}>
                    <View style={styles.row}>
                        <MaterialIcons name="chat" size={24} color={COLORS.success} />
                        <Text style={styles.itemText}>Chat with us</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={COLORS.textLight} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.item}>
                    <View style={styles.row}>
                        <MaterialIcons name="email" size={24} color={COLORS.info} />
                        <Text style={styles.itemText}>Email us</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={COLORS.textLight} />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: SIZES.padding, paddingTop: 50, backgroundColor: COLORS.white },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    content: { padding: SIZES.padding },
    item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.white, borderRadius: SIZES.radius, marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    itemText: { fontSize: SIZES.md, fontFamily: FONTS.medium, color: COLORS.textPrimary },
});
