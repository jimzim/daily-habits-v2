import { Platform, StyleSheet, Text, View } from 'react-native';

type Props = {
  habitCount: number;
};

export function PlatformInfoCard({ habitCount }: Props) {
  const versionText = Platform.OS === 'web' ? 'n/a' : String(Platform.Version);
  return (
    <View style={styles.card} testID="platform-info-card">
      <Text style={styles.title}>Platform info</Text>
      <View style={styles.row}>
        <Text style={styles.label}>OS:</Text>
        <Text style={styles.value} testID="platform-os">
          {Platform.OS}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Version:</Text>
        <Text style={styles.value} testID="platform-version">
          {versionText}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Habits stored:</Text>
        <Text style={styles.value} testID="platform-habit-count">
          {habitCount}
        </Text>
      </View>
      {Platform.OS === 'web' ? (
        <Text style={styles.warning} testID="platform-storage-warning">
          ephemeral storage — habits reset per browser session
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    width: 130,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  warning: {
    marginTop: 8,
    fontSize: 12,
    color: '#b45309',
    fontStyle: 'italic',
  },
});
