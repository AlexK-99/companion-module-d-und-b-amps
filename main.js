import { InstanceBase, Regex, runEntrypoint, InstanceStatus } from '@companion-module/base'
import { updateA } from './actions.js'
import { updateF } from './feedbacks.js'
import { updateV } from './variables.js'
import { TCPConnection, RemoteDevice, RemoteControlClasses, Types } from 'aes70'
class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config
		this.port = this.getPortFromType(config.type)
		this.info = {}
		this.muteObj = []
		this.muteState = [true, true, true, true]
		this.powerState = true
		this.powerHours = 0;
		this.powerObj = {}
		this.ready = false
		this.updateActions(InstanceStatus.Connecting)
		this.updateVariableDefinitions()
		this.log('info', 'AES70 Device Connection at port: ' + this.port)
		this.connect()
	}

	getPowerHourPath(type) {
		switch (type) {
			case "5D":
				return "Log_Box/Log_PowerOnHours";
			case "D20":
				return "Log/Log_PowerOnHours";
			case "D40":
				return "Log/Log_PowerOnHours";
			case "40D":
				return "Log/Log_PowerOnHours";
			default:
				return "Log/Log_PowerOnHours";
		}
	}

	getPowerPath(type) {
		switch (type) {
			case "5D":
				return "Settings_Box/Settings_PwrOn";
			case "D40":
				return "Settings/Settings_PwrOn";
			case "40D":
				return "Settings/Settings_PwrOn";
			default:
				return "Settings/Settings_PwrOn";
		}
	}

	getPortFromType(type) {
		switch(type) {
			case "5D":
				return 50014;
			case "10D":
				return 30013;
			case "30D":
				return 30013;
			case "40D":
				return 50014;
			case "D20":
				return 30013;
			case "D40":
				return 50014;
			case "D80":
				return 30013;
			case "custom":
				return this.config.port;
			default:
				return 30013;
		}
	}


	setAmpPowerHours(hours) {
		this.powerHours = hours;
		this.setVariableValues({'amp_power_hours': this.powerHours})
	}
	setAmpPower(power, type) {
		let powerType = false;
		switch(type) {
			case "5D":
				powerType = power;
			break;
			case "D40":
				powerType = !power;
			break;
			case "40D":
				powerType = !power;
			break;
			default:
				powerType = !power;
		}
		this.powerState = powerType;
		this.checkFeedbacks('PowerState')
		this.setVariableValues({'amp_power': this.powerState})
	}

	setAmpMute(index, mute) {
		this.muteState[index] = mute;
		this.checkFeedbacks('ChannelState')
		let varindex = `amp_mute_${index}`;
		this.setVariableValues({[varindex]: mute})
	}

	setAmpAPpreset(APpreset){
		// ap preset variables and feedback should get set here
	}

	connect() {
		TCPConnection.connect({
			host: this.config.host,
			port: this.port,
		})
			.then((con) => {
				this.log('info', 'Date: '+ new Date().toISOString()  +' | AES70 Device Connected');
				this.aescon = con
				this.remoteDevice = new RemoteDevice(con)
				this.remoteDevice.set_keepalive_interval(1)
				this.remoteDevice.on("close", (args)=> {
					this.log('warn', 'Date: '+ new Date().toISOString()  +' | AES70 Device Connection closed!')
					this.ready = false
					this.log('warn', 'Date: '+ new Date().toISOString()  +' | AES70 Device Connection Error try reconnect in 10 Seconds!')
					this.updateStatus(InstanceStatus.ConnectionFailure)
					setTimeout(() => {
						this.updateStatus(InstanceStatus.Connecting)
						this.aescon.cleanup()
						this.connect()
					}, 10000)
				})

				this.remoteDevice.on("error", (args)=> {
					this.log('warn', 'Date: '+ new Date().toISOString() +' | AES70 Device Connection closed with Error!')
					this.log('error', JSON.stringify(args))
					this.ready = false
					this.log('warn', 'Date: '+ new Date().toISOString()  +' | AES70 Device Connection Error try reconnect in 10 Seconds!')
					setTimeout(() => {
						this.updateStatus(InstanceStatus.UnknownError, JSON.stringify(args)	);
						this.destroy()
						this.connect()
					}, 10000)
				})
				this.updateStatus(InstanceStatus.Ok)
				this.updateActions() // export actions
				this.updateFeedbacks() // export feedbacks
				this.remoteDevice.DeviceManager.GetModelDescription().then((value)=> {
					this.info["type"] = value.Name
					this.info["version"] = value.Version
					this.remoteDevice.DeviceManager.GetDeviceName().then((name) => {
						this.info["name"] = name
					}).then(()=>{
						this.setVariableValues({'amp_type': this.info.type,'amp_name': this.info.name, 'amp_firmware': this.info.version})
					});
				})
				this.remoteDevice.get_role_map().then((map) => {
					if(map.get(this.getPowerHourPath(this.config.type))) {
						this.intervalPower = setInterval(()=> {
							let powerh = map.get(this.getPowerHourPath(this.config.type))
							powerh.GetReading().then((v) => {
								this.setAmpPowerHours(v.values[0])
							})

						},10000)
					}
					if (map.get(this.getPowerPath(this.config.type))) {
						this.powerObj = map.get(this.getPowerPath(this.config.type))
						this.powerObj.GetPosition().then((v) => {
							if (v.item(0) == 0) {
								this.setAmpPower(true)
							} else {
								this.setAmpPower(false)
							}
							this.checkFeedbacks('PowerState')
						})
						this.powerObj.OnPositionChanged.subscribe((val) => {
							if (val == 0) {
								this.setAmpPower(true)
							} else {

								this.setAmpPower(false)
							}
							this.checkFeedbacks('PowerState')
						})
					}
				})
				this.remoteDevice.get_device_tree().then((tree) => {
					var i = 0
					tree.forEach((treeobj) => {
						if (Array.isArray(treeobj)) {
							treeobj.forEach((obj) => {
								obj.GetClassIdentification().then((cls) => {
									if (cls.ClassID === RemoteControlClasses.OcaMute.ClassID) {
										this.muteObj.push(obj)
										if (i === 3) {
											this.ready = true
											this.muteObj.forEach((v, index) => {
												v.GetState().then((v) => {
													if (v === Types.OcaMuteState.Muted) {
														this.setAmpMute(index, true)
													} else {
														this.setAmpMute(index, false)
													}
													this.checkFeedbacks('ChannelState')
												})
												v.OnStateChanged.subscribe((val) => {
													if (val == 1) {
														this.setAmpMute(index, true)
													} else {
														this.setAmpMute(index, false)
													}
													this.checkFeedbacks('ChannelState')
												})

											})
										}
										i++
									}
								})
							})
						}
					})
				})
			})
			.catch((e) => {
				this.ready = false
				this.log('warn', 'Date: '+ new Date().toISOString()  +' | AES70 Device Connection Error try reconnect in 10 Seconds!')
				setTimeout(() => {
					this.connect()
					this.updateStatus(InstanceStatus.UnknownError, JSON.stringify(e)	);
				}, 10000)
			})
	}

	// When module gets deleted
	async destroy() {
		clearInterval(this.intervalPower)
		this.muteObj.forEach((v)=> {
			v.OnStateChanged.unsubscribe();
		});
		this.powerObj.OnPositionChanged.unsubscribe();
		this.aescon.cleanup()
		this.updateStatus(InstanceStatus.Disconnected)
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
		this.port = this.getPortFromType(config.type)
		if (this.aescon) {
			this.muteObj = []
			this.aescon.cleanup()
			this.updateStatus(InstanceStatus.Connecting)
			this.connect()
		}
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Amp IP',
				width: 8,
				regex: Regex.IP,
				default: '168.178.10.110',
			},
			{
				id: 'type',
				type: 'dropdown',
				label: 'Amp Typ',
				width: 4,
				choices: [
					{ id: '5D', label: '5D' },
					{ id: '10D', label: '10D' },
					{ id: '30D', label: '30D' },
					{ id: '40D', label: '40D' },
					{ id: 'D20', label: 'D20' },
					{ id: 'D40', label: 'D40' },
					{ id: 'D80', label: 'D80' },
					{ id: 'custom', label: 'Custom' },
					],
				default: '5D'
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Target Port',
				width: 4,
				isVisible: (options) => options['type'] == "custom",
				regex: Regex.PORT,
				default: 50014,
			}
		]
	}

	updateActions() {
		updateA(this)
	}

	updateFeedbacks() {
		updateF(this)
	}

	updateVariableDefinitions() {
		updateV(this)
	}
}

runEntrypoint(ModuleInstance, [])
