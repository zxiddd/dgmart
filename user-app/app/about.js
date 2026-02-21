import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../src/config/theme';

export default function AboutScreen() {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.appName}>Degloor Mart</Text>
                <Text style={styles.version}>Version 1.0.0</Text>
                <Text style={styles.description}>Degloor's own delivery app. We deliver food, groceries, and essential services right to your doorstep.</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: SIZES.padding, paddingTop: 50, backgroundColor: COLORS.white },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    content: { padding: SIZES.padding, alignItems: 'center', marginTop: 40 },
    appName: { fontSize: SIZES.xxl, fontFamily: FONTS.bold, color: COLORS.primary, marginBottom: 8 },
    version: { fontSize: SIZES.sm, fontFamily: FONTS.medium, color: COLORS.textLight, marginBottom: 24 },
    description: { textAlign: 'center', fontSize: SIZES.md, fontFamily: FONTS.regular, color: COLORS.textSecondary, lineHeight: 24 },
});
