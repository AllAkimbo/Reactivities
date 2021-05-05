import { makeAutoObservable, runInAction } from "mobx";
import agent from "../api/agent";
import { Activity } from "../models/activity";
import { v4 as uuid } from 'uuid';

export default  class ActivityStore {
  // activities: Activity[] = [];
  // Map object - used in place of the activities array above & provides key: value pairs(can be a object)
  // & has set, get, delete etc. methods 
  activityRegistry = new Map<string, Activity>();
  selectedActivity: Activity | undefined = undefined;
  editMode = false;
  loading = false;
  loadingInitial = true;

  constructor() {
    // automatically makes properties obserables & fns actions
    makeAutoObservable(this)
  }

  get activitiesByDate() {
    // compare activity 'a' date to activity 'b' date
    return Array.from(this.activityRegistry.values()).sort((a, b) => 
      Date.parse(a.date) - Date.parse(b.date));
  }

  loadingActivities = async () => {
    // need to runInAction because everything after await are in the next tick causing the warning
    // [MobX] Since strict-mode is enabled, changing (observed) observable values without using
    // an action is not allowed. Tried to modify: ActivityStore@1.loadingInitial
    // Alernativally, we could have a setLoadingInitial action to update
    // loadingInitial state & call it from within try catch block
    try {
      const activities = await agent.Activities.list();
      runInAction(() => {
        activities.forEach(activity => {
          activity.date = activity.date.split('T')[0];
          // mutating state here, OK in Mobx unlike Redux
          // this.activities.push(activity);
          this.activityRegistry.set(activity.id, activity);
        });
        this.loadingInitial = false;
      })
    } catch (error) {
      console.log(error);
      runInAction(() => {
        this.loadingInitial = false;
      })
    }
  }

  selectActivity = (id: string) => {
    // this.selectedActivity = this.activities.find(a => a.id === id)
    this.selectedActivity = this.activityRegistry.get(id);
  }

  cancelSelectedActivity = () => {
    this.selectedActivity = undefined;
  }

  openForm = (id?: string) => {
    id ? this.selectActivity(id) : this.cancelSelectedActivity();
    this.editMode = true;
  }

  closeForm = () => {
    this.editMode = false;
  }

  createActivity = async (activity: Activity) => {
    this.loading = true;
    activity.id = uuid();
    try {
      await agent.Activities.create(activity);
      runInAction(() => {
        // this.activities.push(activity);
        this.activityRegistry.set(activity.id, activity);
        this.selectedActivity = activity;
        this.editMode = false; 
        this.loading = false;
      })
    } catch (error) {
      console.log(error);
      runInAction(() => {
        this.loading = false;
      })
    }
  }

  updateActivity = async (activity: Activity) => {
    this.loading = true;
    try {
      await agent.Activities.update(activity);
      runInAction(() => {
        // extract the req'd activity to be updated & pass in the updated activity data
        // this.activities = [...this.activities.filter(a => a.id !== activity.id), activity];
        this.activityRegistry.set(activity.id, activity);
        this.selectedActivity = activity;
        this.editMode = false; 
        this.loading = false;
      })
    } catch (error) {
      console.log(error);
      runInAction(() => {
        this.loading = false;
      })
    }
  }

  deleteActivity = async (id: string) => {
    this.loading = true;
    try {
      await agent.Activities.delete(id);
      runInAction(() => {
        // this.activities = [...this.activities.filter(a => a.id !== id)];
        this.activityRegistry.delete(id);
        if (this.selectedActivity?.id === id) this.cancelSelectedActivity();
        this.loading = false;
      })       
    } catch (error) {
      console.log(error);
      runInAction(() => {
        this.loading = false;
      })
    }
  }

}