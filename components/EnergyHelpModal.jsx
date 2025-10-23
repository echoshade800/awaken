import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

export default function EnergyHelpModal({ visible, onClose }) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>How we calculate your energy</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.modalText}>
            • We combine your circadian rhythm and recent sleep to estimate alertness.
          </Text>
          
          <Text style={styles.modalText}>
            • <Text style={styles.modalBold}>Formula (simplified):</Text> Energy(t) = C(t) − S(t) + baseline
          </Text>
          
          <View style={styles.formulaDetails}>
            <Text style={styles.formulaItem}>– C(t): circadian oscillator (≈24h natural rhythm)</Text>
            <Text style={styles.formulaItem}>– S(t): sleep pressure from recent sleep debt</Text>
            <Text style={styles.formulaItem}>– baseline: personal adjustment from your preferences (early bird / night owl)</Text>
          </View>

          <Text style={styles.modalText}>
            • <Text style={styles.modalBold}>Inputs we consider</Text> (for the demo some are simulated): sleep/wake times, phone-usage as light proxy, recent sleep debt, and stated preference.
          </Text>

          <Text style={styles.modalText}>
            • <Text style={styles.modalBold}>Ranges we use:</Text>
          </Text>
          
          <View style={styles.rangeList}>
            <Text style={styles.rangeItem}>– ≥80: Peak  • 60–79: Rising  • 40–59: Moderate</Text>
            <Text style={styles.rangeItem}>– 20–39: Declining  • &lt;20: Low</Text>
          </View>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onClose}
          >
            <Text style={styles.primaryButtonText}>Got it</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              // Stub for "Learn more"
              onClose();
            }}
          >
            <Text style={styles.secondaryButtonText}>Learn more</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  modalBold: {
    fontWeight: '600',
    color: '#1F2937',
  },
  formulaDetails: {
    marginLeft: 16,
    marginBottom: 16,
  },
  formulaItem: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 4,
  },
  rangeList: {
    marginLeft: 16,
    marginBottom: 32,
  },
  rangeItem: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 4,
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
});
