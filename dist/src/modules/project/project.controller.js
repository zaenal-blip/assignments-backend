import { ApiError } from "../../utils/api-error.js";
export class ProjectController {
    projectService;
    constructor(projectService) {
        this.projectService = projectService;
    }
    getProjects = async (req, res) => {
        try {
            const query = {
                page: Number(req.query.page) || 1,
                take: Number(req.query.take) || 10,
                search: req.query.search,
                sortBy: req.query.sortBy || "createdAt",
                sortOrder: req.query.sortOrder || "desc",
            };
            const result = await this.projectService.getProjects(query);
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    getProjectById = async (req, res) => {
        try {
            const id = Number(req.params.id);
            const result = await this.projectService.getProjectById(id);
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    createProject = async (req, res) => {
        try {
            const result = await this.projectService.createProject(req.body);
            res.status(201).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    updateProject = async (req, res) => {
        try {
            const id = Number(req.params.id);
            const result = await this.projectService.updateProject(id, req.body);
            res.status(200).json(result);
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
    deleteProject = async (req, res) => {
        try {
            const id = Number(req.params.id);
            await this.projectService.deleteProject(id);
            res.status(200).json({ message: "Project deleted successfully" });
        }
        catch (error) {
            const status = error instanceof ApiError ? error.status : 500;
            res.status(status).json({ message: error.message });
        }
    };
}
