import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Modal, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../src/config/theme';
import { userAPI } from '../src/services/api';
import { useAuthStore } from '../src/store/authStore';
import Toast from 'react-native-toast-message';

export default function AddAddressScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [label, setLabel] = useState('Home');
    const [fullAddress, setFullAddress] = useState('');
    const [city, setCity] = useState('Degloor');
    const [selectedZone, setSelectedZone] = useState(null);
    const [zones, setZones] = useState([]);
    const [showZonePicker, setShowZonePicker] = useState(false);

    const { profile, fetchAddresses, addresses } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [fetchingZones, setFetchingZones] = useState(true);
    const [phone, setPhone] = useState(profile?.phone || '');
    const [landmark, setLandmark] = useState('');
    const [isDefault, setIsDefault] = useState(true);

    useEffect(() => {
        loadZones();
        if (id) {
            const addr = addresses.find(a => a.id.toString() === id.toString());
            if (addr) {
                setFullAddress(addr.full_address.split(',')[0]); // Basic split, might need better logic
                setLandmark(addr.landmark || '');
                setPhone(addr.phone || profile?.phone || '');
                setLabel(addr.label ? addr.label.charAt(0).toUpperCase() + addr.label.slice(1) : 'Home');
                setIsDefault(addr.is_default);
            }
        }
    }, [id]);

    const loadZones = async () => {
        try {
            const res = await userAPI.getZones();
            if (res.success) {
                setZones(res.data.zones);
                if (res.data.zones.length > 0) {
                    setSelectedZone(res.data.zones[0]);
                    setCity(res.data.zones[0].name);
                }
            }
        } catch (error) {
            console.log('Failed to fetch zones:', error);
        } finally {
            setFetchingZones(false);
        }
    };

    const handleSave = async () => {
        if (!fullAddress.trim()) {
            Alert.alert('Error', 'Please enter full address');
            return;
        }

        if (!selectedZone) {
            Alert.alert('Error', 'Please select a delivery zone');
            return;
        }

        setLoading(true);
        try {
            const data = {
                label: label.toLowerCase(),
                full_address: `${fullAddress}, ${landmark ? landmark + ', ' : ''}${selectedZone.name}`,
                landmark,
                phone,
                is_default: isDefault,
                lat: 18.5492,
                lng: 77.5746
            };

            const res = id ? await userAPI.updateAddress(id, data) : await userAPI.addAddress(data);

            if (res.success) {
                Toast.show({ type: 'success', text1: id ? 'Address Updated' : 'Address Saved' });
                await fetchAddresses();
                router.back();
            } else {
                throw new Error(res.message || 'Failed to save');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{id ? 'Edit Address' : 'Add New Address'}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>

                <Text style={styles.sectionTitle}>Label</Text>
                <View style={styles.labelContainer}>
                    {['Home', 'Work', 'Other'].map((l) => (
                        <TouchableOpacity
                            key={l}
                            style={[styles.labelChip, label === l && styles.activeChip]}
                            onPress={() => setLabel(l)}
                        >
                            <Text style={[styles.labelText, label === l && styles.activeLabelText]}>{l}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Details</Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Address (House No, Building, Street)</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        placeholder="e.g. Plot No. 42, Near Bus Stand"
                        value={fullAddress}
                        onChangeText={setFullAddress}
                        multiline
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Landmark (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Behind SBI Bank"
                        value={landmark}
                        onChangeText={setLandmark}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Contact Number for this address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="10-digit mobile number"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={phone}
                        onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
                    />
                    <Text style={{ fontSize: 11, color: COLORS.textLight, marginTop: 4 }}>This number will be used for delivery updates.</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>City/Delivery Zone</Text>
                    <TouchableOpacity
                        style={[styles.input, styles.pickerButton]}
                        onPress={() => setShowZonePicker(true)}
                        disabled={fetchingZones}
                    >
                        {fetchingZones ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <>
                                <Text style={styles.pickerText}>{selectedZone ? selectedZone.name : 'Select Zone'}</Text>
                                <MaterialIcons name="arrow-drop-down" size={24} color={COLORS.textSecondary} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setIsDefault(!isDefault)}
                >
                    <MaterialIcons
                        name={isDefault ? "check-box" : "check-box-outline-blank"}
                        size={24}
                        color={COLORS.primary}
                    />
                    <Text style={styles.checkboxText}>Set as default address</Text>
                </TouchableOpacity>

            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={loading || fetchingZones}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.saveBtnText}>{id ? 'UPDATE ADDRESS' : 'SAVE ADDRESS'}</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Zone Picker Modal */}
            <Modal
                visible={showZonePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowZonePicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowZonePicker(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Delivery Zone</Text>
                            <TouchableOpacity onPress={() => setShowZonePicker(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={zones}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.zoneItem}
                                    onPress={() => {
                                        setSelectedZone(item);
                                        setShowZonePicker(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.zoneItemText,
                                        selectedZone?.id === item.id && styles.activeZoneText
                                    ]}>{item.name}</Text>
                                    {selectedZone?.id === item.id && (
                                        <MaterialIcons name="check" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => (
                                <Text style={styles.emptyText}>No active delivery zones found</Text>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: SIZES.padding, paddingTop: 50, backgroundColor: COLORS.white, ...SHADOWS.sm },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    scroll: { padding: SIZES.padding },
    sectionTitle: { fontSize: SIZES.md, fontFamily: FONTS.bold, color: COLORS.textPrimary, marginBottom: 12, marginTop: 8 },
    labelContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    labelChip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
    activeChip: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    labelText: { color: COLORS.textSecondary, fontFamily: FONTS.medium },
    activeLabelText: { color: COLORS.white, fontFamily: FONTS.bold },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginBottom: 8, fontFamily: FONTS.medium },
    input: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radius, padding: 12, fontFamily: FONTS.regular, fontSize: SIZES.md, color: COLORS.textPrimary },
    pickerButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pickerText: { fontFamily: FONTS.medium, fontSize: SIZES.md, color: COLORS.textPrimary },
    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 24 },
    checkboxText: { marginLeft: 8, fontSize: SIZES.md, color: COLORS.textPrimary, fontFamily: FONTS.medium },
    footer: { padding: SIZES.padding, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border },
    saveBtn: { backgroundColor: COLORS.primary, borderRadius: SIZES.radius, paddingVertical: 14, alignItems: 'center', ...SHADOWS.md },
    saveBtnText: { color: COLORS.white, fontSize: SIZES.md, fontFamily: FONTS.bold, letterSpacing: 1 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: SIZES.lg, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    zoneItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    zoneItemText: { fontSize: SIZES.md, fontFamily: FONTS.medium, color: COLORS.textSecondary },
    activeZoneText: { color: COLORS.primary, fontFamily: FONTS.bold },
    emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 20, fontFamily: FONTS.regular }
});
