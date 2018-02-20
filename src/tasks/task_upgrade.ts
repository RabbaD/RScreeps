import {Task} from './Task';
import {profile} from '../lib/Profiler';

export type upgradeTargetType = StructureController;
export const upgradeTaskName = 'upgrade';


@profile
export class TaskUpgrade extends Task {
	target!: upgradeTargetType;

	constructor(target: upgradeTargetType, options = {} as TaskOptions) {
		super(upgradeTaskName, target, options);
		// Settings
		this.settings.targetRange = 3;
		this.settings.moveColor = 'purple';
		this.settings.workOffRoad = true;
		this.data.quiet = true;
	}

	isValidTask() {
		return (this.creep.carry.energy > 0);
	}

	isValidTarget() {
		return this.target && this.target.my;
	}

	work() {
		return this.creep.upgradeController(this.target);
	}
}

