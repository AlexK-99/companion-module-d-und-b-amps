export async function updateV(self) {
	const varList = [
		{ variableId: 'amp_type', name: 'Amp Type' },
		{ variableId: 'amp_name', name: 'Amp Name' },
		{ variableId: 'amp_firmware', name: 'Amp Firmware' },
		{ variableId: 'amp_power', name: 'Amp Power' },
		{ variableId: 'amp_power_hours', name: 'Amp Power Hours' },
		{ variableId: 'amp_mute_0', name: 'Amp Mute Ch1' },
		{ variableId: 'amp_mute_1', name: 'Amp Mute Ch2' },
		{ variableId: 'amp_mute_2', name: 'Amp Mute Ch3' },
		{ variableId: 'amp_mute_3', name: 'Amp Mute Ch4' },
	]

	if (self.type != '5D') {
		varList.push(
			{ variableId: 'amp_preset_last', name: 'Last Amp Preset Recall' },
			{ variableId: 'amp_preset_1', name: 'Amp Preset User 1' },
			{ variableId: 'amp_preset_2', name: 'Amp Preset User 2' },
			{ variableId: 'amp_preset_3', name: 'Amp Preset User 3' },
			{ variableId: 'amp_preset_4', name: 'Amp Preset User 4' },
			{ variableId: 'amp_preset_5', name: 'Amp Preset User 5' },
			{ variableId: 'amp_preset_6', name: 'Amp Preset User 6' },
			{ variableId: 'amp_preset_7', name: 'Amp Preset User 7' },
			{ variableId: 'amp_preset_8', name: 'Amp Preset User 8' },
			{ variableId: 'amp_preset_9', name: 'Amp Preset User 9' },
			{ variableId: 'amp_preset_10', name: 'Amp Preset Alarm 1' },
			{ variableId: 'amp_preset_11', name: 'Amp Preset Alarm 2' },
			{ variableId: 'amp_preset_12', name: 'Amp Preset Alarm 3' },
			{ variableId: 'amp_preset_13', name: 'Amp Preset Backup 1' },
			{ variableId: 'amp_preset_14', name: 'Amp Preset Backup 2' },
			{ variableId: 'amp_preset_15', name: 'Amp Preset Backup 3' },
			{ variableId: 'amp_preset_state_1', name: 'Amp Preset State User 1' },
			{ variableId: 'amp_preset_state_2', name: 'Amp Preset State User 2' },
			{ variableId: 'amp_preset_state_3', name: 'Amp Preset State User 3' },
			{ variableId: 'amp_preset_state_4', name: 'Amp Preset State User 4' },
			{ variableId: 'amp_preset_state_5', name: 'Amp Preset State User 5' },
			{ variableId: 'amp_preset_state_6', name: 'Amp Preset State User 6' },
			{ variableId: 'amp_preset_state_7', name: 'Amp Preset State User 7' },
			{ variableId: 'amp_preset_state_8', name: 'Amp Preset State User 8' },
			{ variableId: 'amp_preset_state_9', name: 'Amp Preset State User 9' },
			{ variableId: 'amp_preset_state_10', name: 'Amp Preset State Alarm 1' },
			{ variableId: 'amp_preset_state_11', name: 'Amp Preset State Alarm 2' },
			{ variableId: 'amp_preset_state_12', name: 'Amp Preset State Alarm 3' },
			{ variableId: 'amp_preset_state_13', name: 'Amp Preset State Backup 1' },
			{ variableId: 'amp_preset_state_14', name: 'Amp Preset State Backup 2' },
			{ variableId: 'amp_preset_state_15', name: 'Amp Preset State Backup 3' },
		)
	}

	self.setVariableDefinitions(varList)
}
