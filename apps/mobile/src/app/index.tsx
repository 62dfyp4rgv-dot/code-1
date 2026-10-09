import { Text, View } from 'react-native';
import { COMPETITIONS } from '@fu/engine';
export default function Index() { return <View><Text>comps {Object.keys(COMPETITIONS).length}</Text></View>; }
