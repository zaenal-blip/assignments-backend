import { ApiError } from "../../utils/api-error.js";
export class RegularJobController {
    regularJobService;
    constructor(regularJobService) {
        this.regularJobService = regularJobService;
    }
    getRegularJobs = async (req, res) => {
        try {
            const result = await this.regularJobService.getRegularJobs(req.user.id);
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    createRegularJob = async (req, res) => {
        try {
            const { name, category, frequency, date, startTime, endTime } = req.body;
            let { picId } = req.body;
            // Ensure members can only create for themselves
            if (req.user.role === "MEMBER") {
                picId = req.user.id;
            }
            else if (!picId) {
                picId = req.user.id;
            }
            const result = await this.regularJobService.createRegularJob(name, picId, category, frequency, date, startTime, endTime);
            res.status(201).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    updateRegularJob = async (req, res) => {
        try {
            const id = Number(req.params.id);
            const { name, progress } = req.body;
            // Ownership check for security
            const existing = await this.regularJobService.getRegularJobById(id);
            if (req.user.role === "MEMBER" && existing.picId !== req.user.id) {
                throw new ApiError("Forbidden: You can only update your own activities", 403);
            }
            const dataToUpdate = {};
            if (name !== undefined)
                dataToUpdate.name = name;
            if (progress !== undefined)
                dataToUpdate.progress = progress;
            const result = await this.regularJobService.updateRegularJob(id, dataToUpdate);
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    createRegularTask = async (req, res) => {
        try {
            const regularJobId = Number(req.params.id);
            const result = await this.regularJobService.createRegularTask(regularJobId, req.body);
            res.status(201).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    deleteRegularJob = async (req, res) => {
        try {
            const id = Number(req.params.id);
            // Ownership check for security
            const existing = await this.regularJobService.getRegularJobById(id);
            if (req.user.role === "MEMBER" && existing.picId !== req.user.id) {
                throw new ApiError("Forbidden: You can only delete your own activities", 403);
            }
            await this.regularJobService.deleteRegularJob(id);
            res.status(200).json({ message: "Regular Job deleted" });
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
}
