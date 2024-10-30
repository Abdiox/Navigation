import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, TextInput, FlatList, StyleSheet } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { collection, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { database } from "./firebase"; // Opdater stien til din Firebase-fil
import { useCollection } from "react-firebase-hooks/firestore";
import Login from "./Login";
import Detail from "./Detail";


// Opret en stack navigator
const Stack = createStackNavigator();

// HomeScreen-komponent
function HomeScreen({ route, navigation }) {
    const userId = route.params.userId; // Hent userId fra navigation props
    const [note, setNote] = useState("");
    const [editObj, setEditObj] = useState(null);

    // Hent notes for den specifikke bruger
    const [values, loading, error] = useCollection(collection(database, `users/${userId}/notes`));
    const data = values?.docs.map((doc) => ({ ...doc.data(), id: doc.id }));

    // Tilføj ny note til Firestore
    async function buttonHandler() {
        if (note.trim()) {
            try {
                await addDoc(collection(database, `users/${userId}/notes`), {
                    note,
                });
                setNote("");
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        } else {
            alert("Note cannot be empty!");
        }
    }

    // Slet en note fra Firestore
    async function deleteDocument(id) {
        try {
            await deleteDoc(doc(database, `users/${userId}/notes`, id));
        } catch (e) {
            console.error("Error deleting document: ", e);
        }
    }

    // Opdater en eksisterende note i Firestore
    async function updateNoteInFirestore(id, updatedData) {
        try {
            await updateDoc(doc(database, `users/${userId}/notes`, id), updatedData);
        } catch (e) {
            console.error("Error updating document: ", e);
        }
    }

    // Sign Out-funktion
    async function handleSignOut() {
        const auth = getAuth(); // Initialiser auth
        try {
            await signOut(auth);
            navigation.replace("Login"); // Naviger tilbage til Login-skærmen
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My Notes</Text>
            <TextInput style={styles.input} placeholder="Add a note" value={note} onChangeText={(text) => setNote(text)} />
            {editObj ? (
                <Button mode="contained" onPress={() => updateNoteInFirestore(editObj.id, { note })} style={styles.saveButton}>
                    Save Changes
                </Button>
            ) : (
                <Button mode="contained" onPress={buttonHandler} style={styles.addButton}>
                    Add Note
                </Button>
            )}
            <FlatList
                data={data}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Card
                        style={styles.card}
                        onPress={() =>
                            navigation.navigate("Detail", {
                                note: item,
                                index: item.id,
                                updateNoteInFirestore,
                            })
                        }
                    >
                        <Card.Content>
                            <Text style={styles.noteText}>{item.note}</Text>
                        </Card.Content>
                        <Card.Actions>
                            <Button onPress={() => deleteDocument(item.id)}>Delete</Button>
                        </Card.Actions>
                    </Card>
                )}
            />
            <Button mode="outlined" onPress={handleSignOut} style={styles.signOutButton}>
                Sign Out
            </Button>
        </View>
    );
}

// Stil for komponenten
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    header: {
        fontSize: 24,
        marginBottom: 16,
        textAlign: "center",
    },
    input: {
        height: 40,
        borderColor: "gray",
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 10,
    },
    addButton: {
        marginBottom: 12,
    },
    saveButton: {
        marginBottom: 12,
    },
    card: {
        marginBottom: 10,
    },
    noteText: {
        fontSize: 18,
    },
    signOutButton: {
        marginTop: 20,
        alignSelf: "center",
    },
});

// App komponent
export default function App() {
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState(null);
    const auth = getAuth();

    // Håndterer autentificering
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (initializing) setInitializing(false);
        });
        return () => unsubscribe();
    }, [auth, initializing]);

    if (initializing) {
        return null; // Eller returner en loader her, hvis du ønsker det
    }

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName={user ? "Home" : "Login"}>
                <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Detail" component={Detail} />
                {/* Tilføj flere skærme som Detail, osv. */}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
