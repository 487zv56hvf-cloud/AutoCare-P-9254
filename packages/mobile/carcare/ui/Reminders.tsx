import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t, type Lang } from '../i18n';
import { supportsReminders, testReminder } from '../notifications';
import { s, COLORS } from './theme';
import { ODO_FREQUENCIES, odoFrequencyLabel, type OdoFrequency } from '../odometer-reminders';
export type ReminderStatus = 'on'|'off'|'denied'|'error';
export function Reminders({lang,rtl,enabled,status,onToggle,odo,onOdo}:{lang:Lang;rtl:boolean;enabled:boolean;status:ReminderStatus;onToggle:()=>Promise<void>;odo?:OdoFrequency;onOdo?:(f:OdoFrequency)=>void}) {
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const align={textAlign:rtl?'right':'left'} as const;
  async function toggle() { setBusy(true);setMessage('');try { await onToggle(); } finally {setBusy(false);} }
  async function test() {
    setBusy(true);
    try {setMessage(t(lang,await testReminder(lang)?'reminderTestSent':'remindersDenied'));}
    catch {setMessage(t(lang,'remindersError'));}
    finally {setBusy(false);}
  }
  return <View style={s.card} testID="service-reminders">
    <View style={{flexDirection:rtl?'row-reverse':'row',alignItems:'center',gap:8}}>
      <Ionicons name="notifications-outline" size={20} color={COLORS.primary}/>
      <Text style={s.itemTitle}>{t(lang,'reminders')}</Text>
    </View>
    <Text style={[s.muted,align,{lineHeight:20,marginTop:8}]}>{t(lang,'remindersInfo')}</Text>
    <Text style={[s.hint,align,{lineHeight:19,marginTop:8}]}>{t(lang,'remindersEstimate')}</Text>
    {!supportsReminders ? <Text style={[s.note,align]}>{t(lang,'remindersWeb')}</Text> : <>
      <Text accessibilityLiveRegion="polite" style={[s.note,align,{color:status==='denied'||status==='error'?COLORS.overdue:COLORS.primary}]}>
        {t(lang,status==='on'?'remindersOn':status==='off'?'remindersOff':status==='denied'?'remindersDenied':'remindersError')}
      </Text>
      <TouchableOpacity testID="reminders-toggle" disabled={busy} onPress={toggle} style={[s.secondaryBtn,{marginTop:12,opacity:busy?0.5:1}]}>
        <Text style={s.secondaryBtnText}>{t(lang,enabled?'remindersDisable':'remindersEnable')}</Text>
      </TouchableOpacity>
      {enabled && <TouchableOpacity disabled={busy} onPress={test} style={s.linkBtn} testID="reminders-test"><Text style={s.linkText}>{t(lang,'reminderTest')}</Text></TouchableOpacity>}
        {odo && onOdo && <View style={{borderTopWidth:1,borderTopColor:COLORS.border,marginTop:16,paddingTop:16}} testID="odo-reminders">
        <View style={{flexDirection:rtl?'row-reverse':'row',alignItems:'center',gap:8}}>
          <Ionicons name="speedometer-outline" size={20} color={COLORS.primary}/>
          <Text style={s.itemTitle}>{t(lang,'odoRemindersTitle')}</Text>
        </View>
        <Text style={[s.muted,align,{lineHeight:20,marginTop:8}]}>{t(lang,'odoRemindersInfo')}</Text>
        <View style={{flexDirection:rtl?'row-reverse':'row',flexWrap:'wrap',gap:8,marginTop:12}} accessibilityRole="radiogroup">
          {ODO_FREQUENCIES.map(f=>{const on=f===odo;return <TouchableOpacity key={f} testID={`odo-freq-${f}`} onPress={()=>onOdo(f)}
            accessibilityRole="radio" accessibilityState={{checked:on}}
            style={[s.chip,on&&{backgroundColor:COLORS.primary,borderColor:COLORS.primary}]}>
            <Text style={[s.chipText,on&&{color:'#fff'}]}>{odoFrequencyLabel(lang,f)}</Text>
          </TouchableOpacity>;})}
        </View>
        {!enabled && odo!=='off' && <Text style={[s.hint,align,{marginTop:10}]} testID="odo-need-on">{t(lang,'odoRemindersNeedOn')}</Text>}
      </View>}
    </>}
    {!!message && <Text accessibilityLiveRegion="polite" style={[s.note,align]}>{message}</Text>}
  </View>;
}
