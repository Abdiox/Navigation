import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TextInput, Button } from "react-native";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged
} from "firebase/auth";

export default function Login({ navigation }) {
    const [enteredEmail, setEnteredEmail] = useState("");
    const [enteredPassword, setEnteredPassword] = useState("");
    const [userId, setUserId] = useState(null);
    const auth = getAuth();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUserId(currentUser.uid);
                navigation.replace("Home", { userId: currentUser.uid });
            } else {
                setUserId(null);
            }
        });
        return unsubscribe;
    }, []);

    async function login() {
        try {
            const userCredentials = await signInWithEmailAndPassword(auth, enteredEmail, enteredPassword);
            setUserId(userCredentials.user.uid);
            navigation.replace("Home", { userId: userCredentials.user.uid });
        } catch (error) {
            console.log("error login " + error);
        }
    }

    async function signup() {
        try {
            const userCredentials = await createUserWithEmailAndPassword(auth, enteredEmail, enteredPassword);
            setUserId(userCredentials.user.uid);
            navigation.replace("Home", { userId: userCredentials.user.uid });
        } catch (error) {
            console.log("error signup " + error);
        }
    }

    return (
        <View style={styles.container}>
            <Text>Login</Text>
            <TextInput onChangeText={(newText) => setEnteredEmail(newText)} value={enteredEmail} placeholder="Email" />
            <TextInput
                onChangeText={(newText) => setEnteredPassword(newText)}
                value={enteredPassword}
                placeholder="Password"
                secureTextEntry
            />
            <Button title="Log in" onPress={login} />
            <Button title="Sign up" onPress={signup} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});

