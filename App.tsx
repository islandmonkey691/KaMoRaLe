import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform,
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { createClient, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mijoszflieskuifnyiuo.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_KJxIgmXkvPXQYOj8ylJVWQ_DK8MNIqo';
const supabase = createClient(supabaseUrl, supabaseKey);

type Post = {
  id: string; author_id: string; body: string; created_at: string;
  profile?: { display_name?: string; username?: string; avatar_url?: string };
  likes?: number;
};

const blue = '#1877F2';
const ink = '#17212B';
const muted = '#667085';
const surface = '#FFFFFF';
const background = '#F0F2F5';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('Home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [draft, setDraft] = useState('');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) loadProfileAndFeed();
  }, [session?.user?.id]);

  async function loadProfileAndFeed() {
    if (!session?.user) return;
    const { data: person } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    setProfile(person);
    const { data, error } = await supabase.from('posts')
      .select('id,author_id,body,created_at')
      .eq('visibility', 'public').order('created_at', { ascending: false }).limit(40);
    if (error) { console.warn('Feed:', error.message); return; }
    const rows = data || [];
    const ids = [...new Set(rows.map((p: any) => p.author_id))];
    const { data: people } = ids.length
      ? await supabase.from('profiles').select('id,display_name,username,avatar_url').in('id', ids)
      : { data: [] as any[] };
    const byId = Object.fromEntries((people || []).map((p: any) => [p.id, p]));
    setPosts(rows.map((p: any) => ({ ...p, profile: byId[p.author_id] })));
  }

  async function authenticate() {
    if (!supabaseKey) {
      Alert.alert('Setup needed', 'Add your Supabase publishable key as EXPO_PUBLIC_SUPABASE_ANON_KEY in the project environment.');
      return;
    }
    if (!email.trim() || password.length < 6) {
      Alert.alert('Check your details', 'Enter a valid email and a password with at least 6 characters.');
      return;
    }
    setBusy(true);
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { display_name: displayName.trim() } } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) Alert.alert('Unable to continue', result.error.message);
    else if (mode === 'signup' && !result.data.session) Alert.alert('Check your email', 'Confirm your email address, then log in.');
  }

  async function publishPost() {
    const body = draft.trim();
    if (!body || !session?.user) return;
    const { error } = await supabase.from('posts').insert({
      author_id: session.user.id, body, visibility: 'public'
    });
    if (error) Alert.alert('Post not published', error.message);
    else { setDraft(''); await loadProfileAndFeed(); }
  }

  async function likePost(postId: string) {
    if (!session?.user) return;
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: session.user.id });
    if (error && !error.message.toLowerCase().includes('duplicate')) Alert.alert('Like unavailable', error.message);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={blue} /></View>;

  if (!session) return (
    <SafeAreaView style={styles.authPage}>
      <StatusBar barStyle="light-content" />
      <View style={styles.authBrand}>
        <Text style={styles.logo}>K</Text>
        <Text style={styles.brandName}>KaMoRaLe</Text>
        <Text style={styles.tagline}>Across the islands. Connected as one.</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.authCard}>
        <Text style={styles.authTitle}>{mode === 'login' ? 'Welcome back' : 'Join your community'}</Text>
        <Text style={styles.subtle}>Connect with friends, family, and island communities.</Text>
        {mode === 'signup' && <TextInput style={styles.input} placeholder="Your name" value={displayName} onChangeText={setDisplayName} />}
        <TextInput style={styles.input} placeholder="Email address" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <TouchableOpacity style={styles.primaryButton} onPress={authenticate} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{mode === 'login' ? 'Log in' : 'Create account'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'signup' : 'login')} style={styles.switch}>
          <Text style={styles.link}>{mode === 'login' ? 'Create a new account' : 'Already have an account? Log in'}</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
      <Text style={styles.footer}>Micronesia and our people, wherever life takes us. 🇫🇲</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>KaMoRaLe</Text>
        <View style={styles.topActions}>
          <TouchableOpacity style={styles.roundAction} onPress={() => setTab('Search')}><Text>⌕</Text></TouchableOpacity>
          <TouchableOpacity style={styles.roundAction} onPress={() => setTab('Messages')}><Text>✉</Text></TouchableOpacity>
          <TouchableOpacity style={styles.roundAction} onPress={() => supabase.auth.signOut()}><Text>↪</Text></TouchableOpacity>
        </View>
      </View>
      <View style={styles.nav}>
        {['Home', 'Friends', 'Watch', 'Groups', 'Notifications'].map(item => (
          <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.navItem, tab === item && styles.navSelected]}>
            <Text style={[styles.navText, tab === item && styles.navTextSelected]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.feed}>
        <View style={styles.welcomeRow}>
          <Text style={styles.heading}>{tab === 'Home' ? 'Your Feed' : tab}</Text>
          <Text style={styles.subtle}>Welcome{profile?.display_name ? ', ' + profile.display_name : ''}</Text>
        </View>
        {tab === 'Home' ? <>
          <View style={styles.storiesCard}>
            <Text style={styles.cardTitle}>Stories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['Your story', 'Yap', 'Chuuk', 'Pohnpei', 'Kosrae'].map((name, i) => (
                <View key={name} style={styles.story}>
                  <View style={[styles.storyCircle, i === 0 && styles.storyOwn]}><Text style={styles.storyEmoji}>{['＋','🌴','🌊','🌺','☀️'][i]}</Text></View>
                  <Text style={styles.storyName}>{name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
          <View style={styles.composer}>
            <View style={styles.composerTop}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{(profile?.display_name || 'K').slice(0,1).toUpperCase()}</Text></View>
              <TextInput style={styles.composerInput} placeholder="What's on your mind?" value={draft} onChangeText={setDraft} multiline />
            </View>
            <View style={styles.composerActions}>
              <Text style={styles.subtle}>Share with your community</Text>
              <TouchableOpacity style={styles.smallPrimary} onPress={publishPost}><Text style={styles.primaryText}>Post</Text></TouchableOpacity>
            </View>
          </View>
          {posts.map(post => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{(post.profile?.display_name || 'K').slice(0,1).toUpperCase()}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.postAuthor}>{post.profile?.display_name || 'KaMoRaLe member'}</Text>
                  <Text style={styles.subtle}>@{post.profile?.username || 'islander'} · {new Date(post.created_at).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.more}>•••</Text>
              </View>
              <Text style={styles.postBody}>{post.body}</Text>
              <View style={styles.postActions}>
                <TouchableOpacity onPress={() => likePost(post.id)} style={styles.action}><Text style={styles.actionText}>♡  Like</Text></TouchableOpacity>
                <TouchableOpacity style={styles.action} onPress={() => setTab('Comments')}><Text style={styles.actionText}>◯  Comment</Text></TouchableOpacity>
                <TouchableOpacity style={styles.action}><Text style={styles.actionText}>↗  Share</Text></TouchableOpacity>
              </View>
            </View>
          ))}
          {!posts.length && <View style={styles.empty}><Text style={styles.emptyTitle}>Your community starts here 🌺</Text><Text style={styles.subtle}>Be the first to share a moment.</Text></View>}
        </> : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{tab}</Text>
            <Text style={styles.subtle}>This section is part of the KaMoRaLe build plan and is being connected next.</Text>
          </View>
        )}
      </ScrollView>
      <View style={styles.bottomNav}>
        {['Home', 'Friends', 'Groups', 'Notifications', 'Profile'].map(item => (
          <TouchableOpacity key={item} onPress={() => setTab(item)} style={styles.bottomItem}>
            <Text style={[styles.bottomIcon, tab === item && { color: blue }]}>{({Home:'⌂',Friends:'♧',Groups:'▦',Notifications:'♢',Profile:'◉'} as any)[item]}</Text>
            <Text style={[styles.bottomLabel, tab === item && { color: blue }]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:background},
  authPage:{flex:1,backgroundColor:'#123F73',justifyContent:'center',padding:22},
  authBrand:{alignItems:'center',marginBottom:28},
  logo:{width:62,height:62,lineHeight:62,textAlign:'center',borderRadius:18,overflow:'hidden',backgroundColor:'#fff',color:blue,fontSize:38,fontWeight:'900'},
  brandName:{color:'#fff',fontSize:32,fontWeight:'900',marginTop:12},
  tagline:{color:'#dceaff',marginTop:5},
  authCard:{backgroundColor:surface,borderRadius:18,padding:22,maxWidth:460,width:'100%',alignSelf:'center'},
  authTitle:{fontSize:25,fontWeight:'800',color:ink,marginBottom:6},
  subtle:{color:muted,fontSize:13},
  input:{borderWidth:1,borderColor:'#D8DDE5',borderRadius:10,padding:14,marginTop:14,color:ink,backgroundColor:'#fff'},
  primaryButton:{backgroundColor:blue,padding:14,borderRadius:10,alignItems:'center',marginTop:18},
  primaryText:{color:'#fff',fontWeight:'800'},
  switch:{alignItems:'center',padding:16},
  link:{color:blue,fontWeight:'700'},
  footer:{color:'#DCEAFF',textAlign:'center',marginTop:24,fontSize:12},
  page:{flex:1,backgroundColor:background},
  topBar:{height:58,backgroundColor:surface,alignItems:'center',justifyContent:'space-between',flexDirection:'row',paddingHorizontal:16,borderBottomWidth:1,borderBottomColor:'#E4E6EB'},
  wordmark:{fontSize:25,fontWeight:'900',color:blue,letterSpacing:-1},
  topActions:{flexDirection:'row',gap:9},
  roundAction:{width:38,height:38,borderRadius:20,backgroundColor:'#E4E6EB',alignItems:'center',justifyContent:'center'},
  nav:{height:48,backgroundColor:surface,flexDirection:'row',justifyContent:'space-around',borderBottomWidth:1,borderBottomColor:'#E4E6EB'},
  navItem:{justifyContent:'center',paddingHorizontal:9,borderBottomWidth:3,borderBottomColor:'transparent'},
  navSelected:{borderBottomColor:blue},
  navText:{fontSize:12,color:muted,fontWeight:'600'},
  navTextSelected:{color:blue},
  feed:{padding:12,paddingBottom:35,maxWidth:760,width:'100%',alignSelf:'center'},
  welcomeRow:{marginBottom:12},
  heading:{fontSize:23,fontWeight:'800',color:ink},
  storiesCard:{backgroundColor:surface,borderRadius:13,padding:14,marginBottom:12},
  cardTitle:{fontSize:16,fontWeight:'800',color:ink,marginBottom:12},
  story:{alignItems:'center',width:70,marginRight:8},
  storyCircle:{width:52,height:52,borderRadius:27,backgroundColor:'#DDEBFA',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:blue},
  storyOwn:{backgroundColor:'#EEF3F8'},
  storyEmoji:{fontSize:22},
  storyName:{fontSize:11,color:ink,marginTop:5},
  composer:{backgroundColor:surface,borderRadius:13,padding:14,marginBottom:12},
  composerTop:{flexDirection:'row',alignItems:'center',gap:10},
  avatar:{width:42,height:42,borderRadius:22,backgroundColor:'#DCEBFA',alignItems:'center',justifyContent:'center'},
  avatarText:{fontSize:18,fontWeight:'800',color:'#1762B2'},
  composerInput:{flex:1,minHeight:44,maxHeight:100,backgroundColor:background,borderRadius:22,paddingHorizontal:15,paddingVertical:10,color:ink},
  composerActions:{borderTopWidth:1,borderTopColor:'#E4E6EB',marginTop:12,paddingTop:10,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  smallPrimary:{backgroundColor:blue,paddingHorizontal:20,paddingVertical:8,borderRadius:8},
  postCard:{backgroundColor:surface,borderRadius:13,padding:15,marginBottom:12},
  postHeader:{flexDirection:'row',alignItems:'center',gap:10},
  postAuthor:{fontSize:14,fontWeight:'800',color:ink},
  more:{color:muted,fontWeight:'900',paddingHorizontal:5},
  postBody:{fontSize:15,color:ink,lineHeight:23,marginVertical:16},
  postActions:{borderTopWidth:1,borderTopColor:'#E4E6EB',flexDirection:'row',justifyContent:'space-around',paddingTop:10},
  action:{padding:7},
  actionText:{color:muted,fontWeight:'700',fontSize:13},
  empty:{backgroundColor:surface,borderRadius:13,padding:30,alignItems:'center',marginTop:10},
  emptyTitle:{fontSize:17,fontWeight:'800',color:ink,marginBottom:7},
  bottomNav:{height:62,backgroundColor:surface,borderTopWidth:1,borderTopColor:'#E4E6EB',flexDirection:'row',justifyContent:'space-around',alignItems:'center'},
  bottomItem:{alignItems:'center',justifyContent:'center',minWidth:55},
  bottomIcon:{fontSize:20,color:muted},
  bottomLabel:{fontSize:10,color:muted,marginTop:2}
});