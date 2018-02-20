import {Task} from './Task';
import {log} from '../lib/logger/log';
import {profile} from '../lib/Profiler';

export type getRenewedTargetType = StructureSpawn;
export const getRenewedTaskName = 'getRenewed';

@profile
export class TaskGetRenewed extends Task {
	target!: getRenewedTargetType;

	constructor(target: getRenewedTargetType, options = {} as TaskOptions) {
		super(getRenewedTaskName, target, options);
		// Settings
		this.settings.moveColor = 'cyan';
	}

	isValidTask() {
		var creep = this.creep;
		// energyAvailable requirement avoids jams where everything stops to get renewed at the same time
		if (creep.ticksToLive) {
			let condition = creep.ticksToLive < 0.9 * creep.lifetime && creep.room.energyAvailable > 300;
			// console.log(creep.ticksToLive, creep.lifetime, condition);
			return condition;
			// this.creep.log("task" + r)
		} else {
			return false
		}
	}

	isValidTarget() {
		var target = this.target;
		let r = (target != null && target.my && target.structureType == STRUCTURE_SPAWN);
		// this.creep.log(r)
		return r;
	}

	work() {
		let response = this.target.renewCreep(this.creep.creep);
		log.debug('Renewing! ' + this.creep.ticksToLive + '/' + this.creep.lifetime);
		return response;
	}
}
