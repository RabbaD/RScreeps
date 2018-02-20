// Upgrade site for grouping relevant components for an upgrader station

import {HiveCluster} from './HiveCluster';
import {profile} from '../lib/Profiler';
import {UpgradingOverlord} from '../overlords/overlord_upgrade';
import {Colony} from '../Colony';
import {Mem} from '../memory';
import {Visualizer} from '../visuals/Visualizer';

@profile
export class UpgradeSite extends HiveCluster {

	controller: StructureController;					// The controller for the site
	input: StructureLink | StructureContainer | undefined;	// The object receiving energy for the site
	inputConstructionSite: ConstructionSite | undefined;		// The construction site for the input, if there is one
	private settings: {
		storageBuffer: number,
		energyPerBodyUnit: number
	};
	overlord: UpgradingOverlord;

	constructor(colony: Colony, controller: StructureController) {
		super(colony, controller, 'upgradeSite');
		this.controller = controller;
		// Register input
		let siteContainer = this.pos.findClosestByLimitedRange(this.room.containers, 4);
		let siteLink = this.pos.findClosestByLimitedRange(colony.links, 4);
		if (siteLink) {
			this.input = siteLink;
		} else if (siteContainer) {
			this.input = siteContainer;
		}// TODO: add container as battery
		// Register input construction sites
		let nearbyInputSites = this.pos.findInRange(this.room.structureSites, 4, {
			filter: (s: ConstructionSite) => s.structureType == STRUCTURE_CONTAINER ||
											 s.structureType == STRUCTURE_LINK,
		});
		this.inputConstructionSite = nearbyInputSites[0];
		this.settings = {
			storageBuffer    : 100000,	// Number of upgrader parts scales with energy - this value
			energyPerBodyUnit: 50000,	// Scaling factor: this much excess energy adds one extra body repetition
		};
		// Register overlord
		this.overlord = new UpgradingOverlord(this);
	}

	get memory() {
		return Mem.wrap(this.colony.memory, 'upgradeSite');
	}

	get upgradePowerNeeded(): number {
		if (this.room.storage) { // Workers perform upgrading until storage is set up
			let amountOver = Math.max(this.room.storage.energy - this.settings.storageBuffer, 0);
			let upgradePower = 1 + Math.floor(amountOver / this.settings.energyPerBodyUnit);
			if (this.controller.level == 8) {
				upgradePower = Math.min(upgradePower, 15); // don't go above 15 work parts at RCL 8
			}
			return upgradePower;
		} else {
			return 0;
		}
	}

	init(): void {
		// Register energy requests
		if (this.input instanceof StructureLink) {
			if (this.input.energy < 400) {
				this.colony.linkRequests.requestReceive(this.input);
			}
		} else if (this.input instanceof StructureContainer) {
			if (this.input.energy < 0.5 * this.input.storeCapacity) {
				this.colony.transportRequests.requestEnergy(this.input);
			}
		}
	}

	run(): void {

	}

	visuals() {
		let progress = `${Math.floor(this.controller.progress / 1000)}K`;
		let progressTotal = `${Math.floor(this.controller.progressTotal / 1000)}K`;
		let percent = `${Math.floor(100 * this.controller.progress / this.controller.progressTotal)}`;
		let info = [
			`Progress: ${progress}/${progressTotal} (${percent}%)`,
		];
		if (Game.time % 100 == 0) {
			if (this.memory.lastProgress100) {
				let dif = this.controller.progress - this.memory.lastProgress100
				this.memory.dif100  =dif
			}
			this.memory.lastProgress100 = this.controller.progress
		}
		if (Game.time % 1000 == 0) {
			if (this.memory.lastProgress1000) {
				let dif = this.controller.progress - this.memory.lastProgress1000
				this.memory.dif1000  =dif
			}
			this.memory.lastProgress1000 = this.controller.progress
		}
		if (this.memory.dif100) {
			let avgTickDuration = 3.7
			let progressPerTick = this.memory.dif100 / 100
			let progressNeeded = this.controller.progressTotal - this.controller.progress
			let ticksNeeded = progressNeeded / progressPerTick
			let secondsNeeded = ticksNeeded * avgTickDuration
			let timeNeeded = this.transform(secondsNeeded)
			info.push(`Next RCL 100 in: ${timeNeeded}`)
		}
		if (this.memory.dif1000) {
			let avgTickDuration = 3.7
			let progressPerTick = this.memory.dif1000 / 1000
			let progressNeeded = this.controller.progressTotal - this.controller.progress
			let ticksNeeded = progressNeeded / progressPerTick
			let secondsNeeded = ticksNeeded * avgTickDuration
			let timeNeeded = this.transform(secondsNeeded)
			info.push(`Next RCL 1000 in: ${timeNeeded}`)
		}
		Visualizer.showInfo(info, this);
	}
	transform(seconds){
		let times = {
			hour: 3600,
			minute: 60,
			second: 1
		}
        let time_string: string = '';
        for(var key in times){
				time_string += Math.floor(seconds / times[key]).toString().padLeft(2,'0') ;
				if (key!='second') {
					time_string += ':'
				}
                seconds = seconds - times[key] * Math.floor(seconds / times[key]);
        }
        return time_string;
    }
}
