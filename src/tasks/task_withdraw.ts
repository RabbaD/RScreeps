/* This is the task for withdrawing energy. For withdrawing other resources, see taskWithdrawResource. */

import {Task} from './Task';
import {profile} from '../lib/Profiler';

export type withdrawTargetType = StructureContainer | StructureExtension | StructureLab | StructureLink |
	StructureNuker | StructurePowerSpawn | StructureSpawn | StructureStorage | StructureTerminal | StructureTower;
export const withdrawTaskName = 'withdraw';

@profile
export class TaskWithdraw extends Task {
	target!: withdrawTargetType;

	constructor(target: withdrawTargetType, options = {} as TaskOptions) {
		super(withdrawTaskName, target, options);
		// Settings
		this.settings.moveColor = 'blue';
	}

	isValidTask() {
		return _.sum(this.creep.carry) < this.creep.carryCapacity;
	}

	isValidTarget() {
		return this.target && this.target.energy > 0;
	}

	work() {
		return this.creep.withdraw(this.target, RESOURCE_ENERGY);
	}
}
