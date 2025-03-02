import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { BarCodeScanner, BarCodeScannerResult, PermissionResponse } from 'expo-barcode-scanner';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ScanQRScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      try {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === 'granted');
        
        if (status !== 'granted') {
          Alert.alert(
            "Camera Permission Required",
            "Please allow camera access to scan QR codes",
            [
              {
                text: "OK",
                onPress: () => getBarCodeScannerPermissions()
              }
            ]
          );
        }
      } catch (error) {
        console.error('Failed to get camera permission:', error);
        setHasPermission(false);
        Alert.alert("Error", "Could not access your camera. Please check your device settings.");
      }
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: BarCodeScannerResult) => {
    if (scanned) return; // Prevent multiple scans
    
    setScanned(true);
    
    try {
      console.log('QR Code scanned:', data);
      
      // Check if the QR code contains a valid session/event ID
      if (data.includes('session=')) {
        // Extract session ID from URL or string
        const sessionId = data.split('session=')[1]?.split('&')[0];
        if (sessionId) {
          // Navigate to vote screen with the session ID
          router.push({
            pathname: '/vote',
            params: { session: sessionId }
          });
          return;
        }
      } 
      
      // If it's just a plain event ID
      if (/^[a-zA-Z0-9]{6,}$/.test(data)) {
        router.push({
          pathname: '/vote',
          params: { session: data }
        });
        return;
      }
      
      // If no valid format detected
      Alert.alert(
        "Invalid QR Code",
        "Please scan a valid voting event QR code",
        [
          {
            text: "Try Again",
            onPress: () => setScanned(false)
          }
        ]
      );
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert(
        "Error",
        "Could not process QR code. Please try again.",
        [
          {
            text: "OK",
            onPress: () => setScanned(false)
          }
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#28A745" />
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera" size={64} color="#ff6b6b" />
        <Text style={styles.errorText}>Camera access denied</Text>
        <Text style={styles.text}>
          Camera permission is required to scan QR codes. 
          Please enable it in your device settings.
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={() => BarCodeScanner.requestPermissionsAsync()}
        >
          <Text style={styles.permissionButtonText}>Request Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        style={styles.camera}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
          </View>
        </View>
        
        <View style={styles.controls}>
          {scanned && (
            <TouchableOpacity 
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </BarCodeScanner>
      
      <View style={styles.instruction}>
        <Text style={styles.instructionTitle}>Scan Voting QR Code</Text>
        <Text style={styles.instructionText}>
          Position the QR code within the frame to scan
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 15,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  permissionButton: {
    backgroundColor: '#4da6ff',
    padding: 15,
    borderRadius: 10,
    marginTop: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  camera: {
    width: '100%',
    height: '80%',
    position: 'relative',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 280,
    height: 280,
    borderRadius: 20,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#28A745',
    borderTopLeftRadius: 20,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#28A745',
    borderTopRightRadius: 20,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#28A745',
    borderBottomLeftRadius: 20,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#28A745',
    borderBottomRightRadius: 20,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scanAgainButton: {
    backgroundColor: '#28A745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  instruction: {
    backgroundColor: '#292929',
    padding: 15,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  instructionText: {
    color: '#ddd',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  }
});
