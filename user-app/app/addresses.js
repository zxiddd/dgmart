import { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
    TextInput, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, FlatList
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../src/config/theme';
import { useAuthStore } from '../src/store/authStore';
import { userAPI } from '../src/services/api';
import Toast from 'react-native-toast-message';

const LABEL_OPTIONS = ['Home', 'Work', 'Other'];

export default function AddressesScreen() {
    const router = useRouter();
    const { addresses, currentAddress, fetchAddresses, setCurrentAddress, profile, user } = useAuthStore();

    // The single address (first one, or the current one)
    const existingAddress = addresses?.[0] ?? null;
    const editingId = existingAddress?.id ?? null;

    // Form state — pre-fill if address exists
    const [label, setLabel] = useState('Home');
    const [fullAddress, setFullAddress] = useState('');
    const [landmark, setLandmark] = useState('');
    const [phone, setPhone] = useState('');
    const [isDefault, setIsDefault] = useState(true);
    const [selectedZone, setSelectedZone] = useState(null);
    const [zones, setZones] = useState([]);
    const [showZonePicker, setShowZonePicker] = useState(false);
    const [fetchingZones, setFetchingZones] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const init = async () => {
            await fetchAddresses();
            await loadZones();
        };
        init();
    }, []);

    // Once addresses and zones load, populate the form
    useEffect(() => {
        if (!fetchingZones && !loaded) {
            populateForm(existingAddress);
            setLoaded(true);
        }
    }, [fetchingZones, addresses]);

    const loadZones = async () => {
        try {
            const res = await userAPI.getZones();
            if (res.success && res.data.zones.length > 0) {
                setZones(res.data.zones);
                setSelectedZone(res.data.zones[0]);
            }
        } catch (e) {
            console.log('Zone fetch error:', e);
        } finally {
            setFetchingZones(false);
        }
    };

    const populateForm = (addr) => {
        if (addr) {
            setLabel(addr.label ? addr.label.charAt(0).toUpperCase() + addr.label.slice(1) : 'Home');
            setFullAddress(addr.full_address?.split(',')?.[0]?.trim() || '');
            setLandmark(addr.landmark || '');
            setPhone(addr.phone || profile?.phone || '');
            setIsDefault(addr.is_default ?? true);
        } else {
            setPhone(profile?.phone || user?.user_metadata?.phone || '');
        }
    };

    const handleSave = async () => {
        if (!fullAddress.trim()) {
            Alert.alert('Missing Info', 'Please enter your full address.');
            return;
        }
        if (!selectedZone) {
            Alert.alert('Missing Info', 'Please select a delivery zone.');
            return;
        }

        setSaving(true);
        try {
            const data = {
                label: label.toLowerCase(),
                full_address: `${fullAddress.trim()}${landmark.trim() ? ', ' + landmark.trim() : ''}, ${selectedZone.name}`,
                landmark: landmark.trim(),
                phone,
                is_default: true, // always default since only one
                lat: 18.5492,
                lng: 77.5746,
            };

            const res = editingId
                ? await userAPI.updateAddress(editingId, data)
                : await userAPI.addAddress(data);

            if (res.success) {
                Toast.show({ type: 'success', text1: editingId ? 'Address Updated ✅' : 'Address Saved ✅' });
                await fetchAddresses();
                router.back();
            } else {
                throw new Error(res.message || 'Failed to save');
            }
        } catch (e) {
            Alert.alert('Error', e.message || 'Something went wrong');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Delivery Address</Text>
                    <Text style={styles.headerSub}>{editingId ? 'Edit your address' : 'Add your delivery address'}</Text>
                </View>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    {/* Label chips */}
                    <Text style={styles.sectionLabel}>LABEL</Text>
                    <View style={styles.labelRow}>
                        {LABEL_OPTIONS.map((l) => (
                            <TouchableOpacity
                                key={l}
                                style={[styles.labelChip, label === l && styles.labelChipActive]}
                                onPress={() => setLabel(l)}
                            >
                                <MaterialIcons
                                    name={l === 'Work' ? 'work' : l === 'Home' ? 'home' : 'place'}
                                    size={15}
                                    color={label === l ? COLORS.white : COLORS.textSecondary}
                                />
                                <Text style={[styles.labelChipText, label === l && styles.labelChipTextActive]}>{l}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Full Address */}
                    <Text style={styles.sectionLabel}>ADDRESS DETAILS</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>House / Building / Street *</Text>
                        <TextInput
                            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                            placeholder="e.g. Plot No. 42, Near Bus Stand"
                            placeholderTextColor={COLORS.textLight}
                            value={fullAddress}
                            onChangeText={setFullAddress}
                            multiline
                        />
                    </View>

                    {/* Landmark */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Landmark (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Behind SBI Bank"
                            placeholderTextColor={COLORS.textLight}
                            value={landmark}
                            onChangeText={setLandmark}
                        />
                    </View>

                    {/* Phone */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Contact Number</Text>
                        <View style={styles.phoneRow}>
                            <Text style={styles.phonePrefix}>+91</Text>
                            <TextInput
                                style={[styles.input, styles.phoneInput]}
                                placeholder="10-digit number"
                                placeholderTextColor={COLORS.textLight}
                                keyboardType="phone-pad"
                                maxLength={10}
                                value={phone}
                                onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ''))}
                            />
                        </View>
                    </View>

                    {/* Zone */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Delivery Zone *</Text>
                        <TouchableOpacity
                            style={[styles.input, styles.pickerRow]}
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

                    <View style={{ height: 20 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Sticky Save Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveBtn, (saving || fetchingZones) && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={saving || fetchingZones}
                >
                    {saving ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.saveBtnText}>
                            {editingId ? 'UPDATE ADDRESS' : 'SAVE ADDRESS'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Zone picker modal */}
            <Modal visible={showZonePicker} transparent animationType="slide" onRequestClose={() => setShowZonePicker(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowZonePicker(false)}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalSheetHeader}>
                            <Text style={styles.modalSheetTitle}>Select Delivery Zone</Text>
                            <TouchableOpacity onPress={() => setShowZonePicker(false)}>
                                <MaterialIcons name="close" size={24} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={zones}
                            keyExtractor={(z) => z.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.zoneRow}
                                    onPress={() => { setSelectedZone(item); setShowZonePicker(false); }}
                                >
                                    <Text style={[styles.zoneText, selectedZone?.id === item.id && styles.zoneTextActive]}>
                                        {item.name}
                                    </Text>
                                    {selectedZone?.id === item.id && (
                                        <MaterialIcons name="check" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6FA' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
        backgroundColor: COLORS.white, ...SHADOWS.sm
    },
    backButton: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 12
    },
    headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    headerSub: { fontSize: 12, fontFamily: FONTS.regular, color: COLORS.textSecondary, marginTop: 2 },

    scroll: { padding: 16 },

    sectionLabel: {
        fontSize: 11, fontFamily: FONTS.bold, color: COLORS.textSecondary,
        letterSpacing: 1, marginBottom: 10, marginTop: 4
    },

    // Label chips
    labelRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    labelChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 9, borderRadius: 50,
        borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white
    },
    labelChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    labelChipText: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.textSecondary },
    labelChipTextActive: { color: COLORS.white, fontFamily: FONTS.bold },

    // Inputs
    inputGroup: { marginBottom: 14 },
    inputLabel: { fontSize: 12, fontFamily: FONTS.medium, color: COLORS.textSecondary, marginBottom: 6 },
    input: {
        backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
        borderRadius: 12, padding: 13, fontFamily: FONTS.regular, fontSize: 15, color: COLORS.textPrimary
    },
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    phonePrefix: {
        fontSize: 15, fontFamily: FONTS.bold, color: COLORS.textPrimary,
        backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
        borderRadius: 12, padding: 13, paddingHorizontal: 14
    },
    phoneInput: { flex: 1 },
    pickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pickerText: { fontSize: 15, fontFamily: FONTS.medium, color: COLORS.textPrimary },

    // Footer save button
    footer: {
        padding: 16, paddingBottom: 28,
        backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#EBEBEB'
    },
    saveBtn: {
        backgroundColor: COLORS.primary, borderRadius: 50,
        paddingVertical: 15, alignItems: 'center', ...SHADOWS.orange
    },
    saveBtnText: { color: COLORS.white, fontSize: 15, fontFamily: FONTS.bold, letterSpacing: 0.5 },

    // Zone modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 20, maxHeight: '55%'
    },
    modalSheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalSheetTitle: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.textPrimary },
    zoneRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0'
    },
    zoneText: { fontSize: 15, fontFamily: FONTS.medium, color: COLORS.textSecondary },
    zoneTextActive: { color: COLORS.primary, fontFamily: FONTS.bold },
});
