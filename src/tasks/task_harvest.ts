import {Task} from './Task';
import {profile} from '../lib/Profiler';

export type harvestTargetType = Source;
export const harvestTaskName = 'harvest';

@profile
export class TaskHarvest extends Task {
	target!: harvestTargetType;

	constructor(target: harvestTargetType, options = {} as TaskOptions) {
		super(harvestTaskName, target, options);
		// Settings
		this.settings.moveColor = 'yellow';
	}

	isValidTask() {
		return this.creep.carry.energy < this.creep.carryCapacity;
	}

	isValidTarget() {
		return this.target && this.target.energy > 0;
	}

	work() {
		return this.creep.harvest(this.target);
	}
}

